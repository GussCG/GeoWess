CREATE DATABASE GeoWess;
USE GeoWess;

CREATE TABLE USUARIO (
    us_Nombre varchar(50),
    us_ApPaterno varchar(50),
    us_ApMaterno varchar(50),
    us_FechaNac date,
    us_Tipo varchar(50), /* Supervisor, Superintendente, Residente, Contratista, Contratante, Representante legal*/
    us_Telefono int(10),
    us_Email varchar(100),
    us_Password varchar(100),
    
    PRIMARY KEY (us_Email)    
);

CREATE TABLE NOTIFICACION (
    nt_ID int,
    nt_Titulo varchar(100),
    nt_Descripcion varchar(255),
    nt_Fecha date,
    nt_Status boolean, /* 1 = No visto || 0 = Visto */
    nt_Usuario varchar(100),
    
    PRIMARY KEY (nt_ID),
    FOREIGN KEY (nt_Usuario) REFERENCES USUARIO (us_Email)    
);

/* Campos de auditoria */
CREATE TABLE CAMBIO (
    cb_ID int(6),
    cb_Descripcion varchar(255),
    cb_Fecha datetime,
    cb_Usuario varchar(100),
    
    PRIMARY KEY (cb_ID),
    FOREIGN KEY (cb_Usuario) REFERENCES USUARIO (us_Email)    
);

CREATE TABLE OBRA (
    ob_ID int(6),
    ob_Nombre varchar(100),
    
    PRIMARY KEY (ob_ID)    
);

CREATE TABLE PROYECTO (
    pr_ID int,
    pr_Nombre VARCHAR(100),
    pr_FechaInicio date,
    pr_FechaFin date,
    pr_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    pr_Obra int(6),
    
    PRIMARY KEY (pr_ID),
    FOREIGN KEY (pr_Obra) REFERENCES OBRA (ob_ID)     
);

CREATE TABLE FASE_PROYECTO (
    fp_ID int,
    fp_Nombre varchar(100),
    fp_FechaInicio date,
    fp_FechaFin date,
    fp_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    fp_Proyecto int(6),
    
    PRIMARY KEY (fp_ID),
    FOREIGN KEY (fp_Proyecto) REFERENCES PROYECTO (pr_ID)     
);

CREATE TABLE PARTIDA (
    pt_ID int(6),
    pt_Nombre varchar(100),
    pt_Importe float,
    pt_FaseProyecto int(6),
    
    PRIMARY KEY (pt_ID),
    FOREIGN KEY (pt_FaseProyecto) REFERENCES FASE_PROYECTO (fp_ID)   
);

CREATE TABLE CONCEPTO (
    cp_ID int(6),
    cp_Clave varchar(100),
    cp_Nombre varchar(100),
    cp_Unidad varchar(100),
    cp_Cantidad int,
    cp_PrecioUnitario float,
    cp_Importe float,
    cp_Partida int(6),
    
    PRIMARY KEY (cp_ID),
    FOREIGN KEY (cp_Partida) REFERENCES PARTIDA (pt_ID)     
);

