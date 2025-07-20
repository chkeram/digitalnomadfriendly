-- Create exec_sql function for automated database setup
-- This function allows the Node.js script to execute arbitrary SQL

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Execute the SQL and return success status
    EXECUTE sql;
    
    -- Return success response
    SELECT json_build_object('success', true, 'message', 'SQL executed successfully') INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        SELECT json_build_object(
            'success', false, 
            'error', SQLERRM,
            'code', SQLSTATE
        ) INTO result;
        RETURN result;
END;
$$;