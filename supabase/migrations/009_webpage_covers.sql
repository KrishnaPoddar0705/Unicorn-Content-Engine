-- Modern-art cover images for interactive webpages (shown on /blog cards)

ALTER TABLE interactive_webpages ADD COLUMN cover_image_url TEXT;
ALTER TABLE interactive_webpages ADD COLUMN cover_image_prompt TEXT;
