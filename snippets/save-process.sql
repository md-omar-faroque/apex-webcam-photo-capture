DECLARE
    V_PHOTO_BLOB BLOB;
    L_B64        CLOB;
BEGIN
    DBMS_LOB.CREATETEMPORARY(L_B64, TRUE);
    FOR i IN 1 .. APEX_APPLICATION.G_F01.COUNT LOOP
        DBMS_LOB.WRITEAPPEND(L_B64,
                             LENGTH(APEX_APPLICATION.G_F01(i)),
                             APEX_APPLICATION.G_F01(i));
    END LOOP;

    IF DBMS_LOB.GETLENGTH(L_B64) > 0 THEN
        V_PHOTO_BLOB := apex_web_service.clobbase642blob(L_B64);
    ELSE
        V_PHOTO_BLOB := NULL;   -- no new photo: keep the existing one
    END IF;
    DBMS_LOB.FREETEMPORARY(L_B64);

    -- use V_PHOTO_BLOB in your insert / update
END;
