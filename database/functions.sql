-- This function retrieves all conversations for the currently authenticated user
-- along with details of the other participant, the related listing,
-- and the most recent message in each conversation.
CREATE OR REPLACE FUNCTION get_user_conversations_with_details()
RETURNS TABLE (
    conversation_id uuid,
    listing_id uuid,
    listing_title text,
    listing_image_url text,
    renter_id uuid,
    owner_id uuid,
    last_message_content text,
    last_message_time timestamptz,
    owner_details json,
    renter_details json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- The function now explicitly casts the user details to JSON to match the expected return type.
  RETURN QUERY
  WITH last_message AS (
    SELECT
      m.conversation_id,
      m.content,
      m.created_at,
      ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
    FROM messages m
  )
  SELECT
    c.id as conversation_id,
    c.listing_id,
    l.title as listing_title,
    l.images_urls[1] as listing_image_url,
    c.renter_id,
    c.owner_id,
    lm.content as last_message_content,
    lm.created_at as last_message_time,
    json_build_object('id', po.id, 'full_name', po.full_name, 'avatar_url', po.avatar_url) as owner_details,
    json_build_object('id', pr.id, 'full_name', pr.full_name, 'avatar_url', pr.avatar_url) as renter_details
  FROM
    conversations c
  JOIN
    listings l ON c.listing_id = l.id
  JOIN
    profiles po ON c.owner_id = po.id
  JOIN
    profiles pr ON c.renter_id = pr.id
  LEFT JOIN
    last_message lm ON c.id = lm.conversation_id AND lm.rn = 1
  WHERE
    c.owner_id = auth.uid() OR c.renter_id = auth.uid()
  ORDER BY
    lm.created_at DESC;
END;
$$;

-- This function retrieves all booking requests for items owned by the currently authenticated user.
-- It joins bookings with listings and the renters' profiles to provide comprehensive details for the owner to review.
CREATE OR REPLACE FUNCTION get_owner_booking_requests()
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    listing_id uuid,
    renter_id uuid,
    start_date timestamptz,
    end_date timestamptz,
    total_price numeric,
    status text,
    listing_title text,
    listing_image text,
    renter_name text,
    renter_avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.created_at,
    b.listing_id,
    b.renter_id,
    b.start_date,
    b.end_date,
    b.total_price,
    b.status,
    l.title as listing_title,
    l.images_urls[1] as listing_image,
    p.full_name as renter_name,
    p.avatar_url as renter_avatar
  FROM
    bookings b
  JOIN
    listings l ON b.listing_id = l.id
  JOIN
    profiles p ON b.renter_id = p.id
  WHERE
    l.owner_id = auth.uid()
  ORDER BY
    b.created_at DESC;
END;
$$; 