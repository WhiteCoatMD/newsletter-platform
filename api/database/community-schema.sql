-- NewsBuildr Community Database Schema
-- This schema supports posts, replies, user interactions, and moderation

-- First, ensure we have the users table extension for community features
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'subscriber';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP;

-- Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Community Replies Table
CREATE TABLE IF NOT EXISTS community_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0, -- for nested reply depth
    created_at TIMESTAMP DEFAULT NOW(),
    edited_at TIMESTAMP
);

-- User Interactions Table (likes, dislikes, bookmarks, views)
CREATE TABLE IF NOT EXISTS community_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'reply')),
    target_id UUID NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'dislike', 'bookmark', 'view')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id, interaction_type)
);

-- Moderation Reports Table
CREATE TABLE IF NOT EXISTS moderation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'reply', 'user')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    moderator_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Moderation Actions Table (log of all moderation actions)
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'pin', 'lock', 'delete', 'warn', 'ban', etc.
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'reply', 'user')),
    target_id UUID NOT NULL,
    reason TEXT,
    metadata JSONB, -- additional action-specific data
    created_at TIMESTAMP DEFAULT NOW()
);

-- Community Categories Table
CREATE TABLE IF NOT EXISTS community_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- hex color code
    icon VARCHAR(50), -- icon name
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Notifications Table for Community
CREATE TABLE IF NOT EXISTS community_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'reply', 'like', 'mention', 'moderator_action'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    related_reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_last_activity ON community_posts(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_author ON community_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_parent ON community_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_created_at ON community_replies(created_at);

CREATE INDEX IF NOT EXISTS idx_community_interactions_user ON community_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_interactions_target ON community_interactions(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_priority ON moderation_reports(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_created_at ON moderation_reports(created_at DESC);

-- Insert Default Categories
INSERT INTO community_categories (name, description, color, icon, display_order) VALUES
('Tips & Strategies', 'Share and discuss newsletter best practices', '#3B82F6', 'lightbulb', 1),
('Showcase', 'Show off your best newsletters and get feedback', '#10B981', 'star', 2),
('Tools & Tech', 'Discuss AI tools, platforms, and technical topics', '#8B5CF6', 'cog', 3),
('Q&A', 'Ask questions and get help from the community', '#F59E0B', 'question-mark-circle', 4),
('Announcements', 'Official announcements and updates', '#EF4444', 'megaphone', 5),
('Off-Topic', 'General discussion and community chat', '#6B7280', 'chat-bubble-left-right', 6)
ON CONFLICT (name) DO NOTHING;

-- Functions for maintaining counters and last activity
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update replies count and last activity when reply is added
        UPDATE community_posts
        SET replies_count = replies_count + 1,
            last_activity_at = NEW.created_at
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update replies count when reply is deleted
        UPDATE community_posts
        SET replies_count = GREATEST(0, replies_count - 1)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_interaction_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update like/dislike counters when interaction is added
        IF NEW.target_type = 'post' THEN
            IF NEW.interaction_type = 'like' THEN
                UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
            ELSIF NEW.interaction_type = 'dislike' THEN
                UPDATE community_posts SET dislikes_count = dislikes_count + 1 WHERE id = NEW.target_id;
            ELSIF NEW.interaction_type = 'view' THEN
                UPDATE community_posts SET views_count = views_count + 1 WHERE id = NEW.target_id;
            END IF;
        ELSIF NEW.target_type = 'reply' THEN
            IF NEW.interaction_type = 'like' THEN
                UPDATE community_replies SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
            ELSIF NEW.interaction_type = 'dislike' THEN
                UPDATE community_replies SET dislikes_count = dislikes_count + 1 WHERE id = NEW.target_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update counters when interaction is removed
        IF OLD.target_type = 'post' THEN
            IF OLD.interaction_type = 'like' THEN
                UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
            ELSIF OLD.interaction_type = 'dislike' THEN
                UPDATE community_posts SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.target_id;
            END IF;
        ELSIF OLD.target_type = 'reply' THEN
            IF OLD.interaction_type = 'like' THEN
                UPDATE community_replies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
            ELSIF OLD.interaction_type = 'dislike' THEN
                UPDATE community_replies SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.target_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers
DROP TRIGGER IF EXISTS trigger_update_post_counters ON community_replies;
CREATE TRIGGER trigger_update_post_counters
    AFTER INSERT OR DELETE ON community_replies
    FOR EACH ROW EXECUTE FUNCTION update_post_counters();

DROP TRIGGER IF EXISTS trigger_update_interaction_counters ON community_interactions;
CREATE TRIGGER trigger_update_interaction_counters
    AFTER INSERT OR DELETE ON community_interactions
    FOR EACH ROW EXECUTE FUNCTION update_interaction_counters();

-- Views for easier querying
CREATE OR REPLACE VIEW community_posts_with_stats AS
SELECT
    p.*,
    u.name as author_name,
    u.email as author_email,
    u.avatar_url as author_avatar,
    u.role as author_role,
    c.name as category_name,
    c.color as category_color,
    (SELECT COUNT(*) FROM community_interactions WHERE target_type = 'post' AND target_id = p.id AND interaction_type = 'bookmark') as bookmarks_count
FROM community_posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN community_categories c ON p.category = c.name
WHERE p.is_deleted = FALSE;

CREATE OR REPLACE VIEW community_replies_with_stats AS
SELECT
    r.*,
    u.name as author_name,
    u.email as author_email,
    u.avatar_url as author_avatar,
    u.role as author_role
FROM community_replies r
JOIN users u ON r.author_id = u.id
WHERE r.is_deleted = FALSE;