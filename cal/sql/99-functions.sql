CREATE FUNCTION in_pile(integer, integer) RETURNS boolean AS '
BEGIN IF (SELECT id FROM piles WHERE owner=$1 AND member=$2) IS NULL THEN
    RETURN FALSE;
ELSE
    RETURN TRUE;
END IF; END;
' LANGUAGE 'plpgsql';
