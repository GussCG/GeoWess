CREATE DATABASE GeoWess;
USE GeoWess;

DROP DATABASE GeoWess;

CREATE TABLE USUARIO (
    us_Nombre varchar(50),
    us_ApPaterno varchar(50),
    us_ApMaterno varchar(50),
    us_FechaNac date,
    us_Tipo varchar(50), /* Supervisor, Superintendente, Residente, Contratista, Contratante, Representante legal*/
    us_Telefono int(10),
    us_RFC char(13),
    us_Email varchar(100),
    us_Password varchar(100),
    
    PRIMARY KEY (us_Email)    
);

/*SUPERVISANTE DE SERVICIOS*/
CREATE TABLE SUPERVISANTE (
	sup_ID int(6),
    sup_Usuario varchar(100),
    
    PRIMARY KEY (sup_ID),
    FOREIGN KEY (sup_Usuario) REFERENCES USUARIO (us_Email)
);

CREATE TABLE SUPERVISOR (
	sp_ID int(6),
    sp_Usuario varchar(100),
    
    PRIMARY KEY (sp_ID),
    FOREIGN KEY (sp_Usuario) REFERENCES USUARIO (us_Email)
);

/*RESIDENTE DE SERVICIOS*/
CREATE TABLE RESIDENTE (
	res_ID int(6),
    res_Usuario varchar(100),
    
    PRIMARY KEY (res_ID),
    FOREIGN KEY (res_Usuario) REFERENCES USUARIO (us_Email)
);

CREATE TABLE REPRESENTATE_LEGAL (
	rpl_ID int(6),
    rpl_Usuario varchar(100),
    
    PRIMARY KEY (rpl_ID),
    FOREIGN KEY (rpl_Usuario) REFERENCES USUARIO (us_Email)
);

CREATE TABLE CONTRATISTA (
	cta_ID int(6),
    cta_RepresentanteLegal int(6),
    cta_Usuario varchar(100),
    cta_Supervisante int(6),
    
    PRIMARY KEY (cta_ID),
    FOREIGN KEY (cta_RepresentanteLegal) REFERENCES REPRESENTANTE_LEGAL (rpl_ID),
    FOREIGN KEY (cta_Usuario) REFERENCES USUARIO (us_Email),
    FOREIGN KEY (cta_Supervisante) REFERENCES SUPERVISANTE (sup_ID)
);

CREATE TABLE CONTRATANTE (
	cte_ID int(6),
    cte_FrenteObra int(6),
    cte_Usuario varchar(100),
    cte_Residente int(6),
    
    PRIMARY KEY (cte_ID),
    FOREIGN KEY (cte_FrenteObra) REFERENCES FRENTE_DE_OBRA (fob_ID),
    FOREIGN KEY (cte_Usuario) REFERENCES USUARIO (us_Email),
    FOREIGN KEY (cte_Residente) REFERENCES RESIDENTE (res_ID)
);

CREATE TABLE SUPERVISORA (
	spa_ID int(6),
    spa_Supervisor int(6),
    spa_RepresentanteLegal int(6),
    
    PRIMARY KEY (spa_ID),
    FOREIGN KEY (spa_Supervisor) REFERENCES SUPERVISOR (sup_ID),
    FOREIGN KEY (spa_RepresentanteLegal) REFERENCES REPRESENTANTE_LEGAL (rpl_ID)
);

CREATE TABLE NOTIFICACION (
    nt_ID int(6),
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

CREATE TABLE PROYECTO (
    pr_ID int(6),
    pr_Nombre VARCHAR(100),
    pr_FechaInicio date,
    pr_FechaFin date,
    pr_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    pr_Obra int(6),
    
    PRIMARY KEY (pr_ID),
    FOREIGN KEY (pr_Obra) REFERENCES OBRA (ob_ID)     
);

CREATE TABLE FASE_PROYECTO (
    fp_ID int(6),
    fp_Nombre varchar(100),
    fp_FechaInicio date,
    fp_FechaFin date,
    fp_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    fp_Proyecto int(6),
    
    PRIMARY KEY (fp_ID),
    FOREIGN KEY (fp_Proyecto) REFERENCES PROYECTO (pr_ID)     
);

CREATE TABLE FRENTE_DE_OBRA (
    fob_ID int(6),
    fob_Nombre varchar(100),
    fob_FaseProyecto int(6),
    fob_Contratista int(6),
    fob_Contratante int(6),
    
    PRIMARY KEY (fob_ID),
    FOREIGN KEY (fob_FaseProyecto) REFERENCES FASE_PROYECTO (fp_ID),
    FOREIGN KEY (fob_Contratista) REFERENCES CONTRATISTA (cta_ID),
    FOREIGN KEY (fob_Contratante) REFERENCES CONTRATANTE (cte_ID)
);

CREATE TABLE PARTIDA (
    pt_ID int(6),
    pt_Nombre varchar(100),
    pt_Importe float,
    pt_FaseProyecto int(6),
    
    PRIMARY KEY (pt_ID),
    FOREIGN KEY (pt_FaseProyecto) REFERENCES FASE_PROYECTO (fp_ID)   
);

CREATE TABLE ESTIMACION (
	es_ID int(6),
    es_Importe float,
    es_fecha date,
    es_Partida int(6),
    
    PRIMARY KEY (es_ID),
    FOREIGN KEY (es_Partida) REFERENCES PARTIDA (pt_ID) 
);

CREATE TABLE CATALOGO_CONCEPTOS (
	cc_ID int(6),
    cc_Concepto int(6),
    
    PRIMARY KEY (cc_ID),
    FOREIGN KEY (cc_Concepto) REFERENCES CONCEPTO (cp_ID)
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

