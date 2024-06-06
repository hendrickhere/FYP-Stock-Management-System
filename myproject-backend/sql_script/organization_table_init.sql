CREATE TABLE organizations(
    organization_id SERIAL PRIMARY KEY, 
    organization_uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(50) NOT NULL, 
    organization_contact VARCHAR(50) NOT NULL
);  

INSERT INTO organizations (organization_id, organization_name, organization_contact)
VALUES (1, 'Bateriku', '+6011116006008');