CREATE DATABASE GeoWess;
USE GeoWess;

SET SQL_SAFE_UPDATES = 0;
set global event_scheduler = on;

DROP DATABASE GeoWess;

/*Todos son usuarios*/
CREATE TABLE USUARIO (	
	us_ID int(6) NOT NULL AUTO_INCREMENT,
    us_Nombre varchar(50),
    us_ApPaterno varchar(50),
    us_ApMaterno varchar(50),
    us_FechaNac date,
    us_FechaHoraCreacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    us_Tipo int, /* Supervisor, Superintendente, Residente de Servicios, Contratista, Contratante, Representante legal, Supervisante de Servicios, Administrador*/
    us_Telefono varchar(10),
    us_RFC char(13),
    us_Email varchar(100),
    us_Password varchar(100),
    
    PRIMARY KEY (us_ID)
);

CREATE TABLE USUARIO_HAS_PROJECTS (
	up_ID char(6),
    up_Usuario char(6),
    up_Proyecto char(6),
	
    PRIMARY KEY (up_ID),
    FOREIGN KEY (up_Usuario) REFERENCES USUARIO (us_ID),
    FOREIGN KEY (up_Proyecto) REFERENCES PROYECTO (pr_ID)
);

ALTER TABLE USUARIO
	CHANGE COLUMN us_ID us_ID int(6) NOT NULL AUTO_INCREMENT,
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (us_ID);

/*ROLES MENORES*/
/*SUPERVISANTE DE SERVICIOS*/
CREATE TABLE SUPERVISANTE (
	sup_ID char(6),
    sup_Usuario char(6), 
    
    PRIMARY KEY (sup_ID),
    FOREIGN KEY (sup_Usuario) REFERENCES USUARIO (us_ID)
);

CREATE TABLE SUPERVISOR (
	sp_ID char(6),
    sp_Usuario char(6),
    
    PRIMARY KEY (sp_ID),
    FOREIGN KEY (sp_Usuario) REFERENCES USUARIO (us_ID)
);

/*RESIDENTE DE SERVICIOS*/
CREATE TABLE RESIDENTE (
	res_ID char(6),
    res_Usuario char(6),
    
    PRIMARY KEY (res_ID),
    FOREIGN KEY (res_Usuario) REFERENCES USUARIO (us_ID)
);

SELECT * FROM RESIDENTE WHERE res_Usuario = 3;

/*Tienen que estar obligadamente, no tiene ningun poder de crear proyectos, modificar o generar estimaciones, pero puede ver los reportes, estimaciones, etc. */
CREATE TABLE REPRESENTATE_LEGAL (
	rpl_ID char(6),
    rpl_Usuario char(6),
    
    PRIMARY KEY (rpl_ID),
    FOREIGN KEY (rpl_Usuario) REFERENCES USUARIO (us_ID)
);

/*ROLES IMPORTANTES*/
/*Ellos pueden ver solamente los proyectos, y las estimaciones mensuales, no pueden modificar ni generar estimaciones*/
CREATE TABLE CONTRATISTA (
	cta_ID char(6),
    cta_RepresentanteLegal char(6),    
    cta_Supervisante char(6),
    cta_Usuario char(6),
    
    PRIMARY KEY (cta_ID),
    FOREIGN KEY (cta_RepresentanteLegal) REFERENCES REPRESENTANTE_LEGAL (rpl_ID),
    FOREIGN KEY (cta_Usuario) REFERENCES USUARIO (us_ID),
    FOREIGN KEY (cta_Supervisante) REFERENCES SUPERVISANTE (sup_ID)
);

/*Es quien puede crear los proyectos, editarlos y eliminarlos*/
CREATE TABLE CONTRATANTE (
	cte_ID char(6),
    cte_Usuario char(6),
    cte_Residente char(6),
    
    PRIMARY KEY (cte_ID),
    FOREIGN KEY (cte_Usuario) REFERENCES USUARIO (us_ID),
    FOREIGN KEY (cte_Residente) REFERENCES RESIDENTE (res_ID)
);

/*Son quienes llenan reportes diarios, validan la estimacion de la obra mensual*/
CREATE TABLE SUPERVISORA (
	spa_ID char(6),
    spa_Supervisor char(6),
    spa_RepresentanteLegal char(6),
    spa_Usuario char(6),
    
    PRIMARY KEY (spa_ID),
    FOREIGN KEY (spa_Supervisor) REFERENCES SUPERVISOR (sup_ID),
    FOREIGN KEY (spa_RepresentanteLegal) REFERENCES REPRESENTANTE_LEGAL (rpl_ID),
    FOREIGN KEY (spa_Usuario) REFERENCES USUARIO (us_ID)
);

CREATE TABLE SUPERINTENDENTE (
	spi_ID char(6),
    spi_Usuario char(6),
    
    PRIMARY KEY (spi_ID),
    FOREIGN KEY (spi_Usuario) REFERENCES USUARIO (us_ID)
);

/* TABLA DE FUNCION DE LOS USUARIOS */
/* Son los mensajes que recibiran los superintendentes, supervisores y residentes para que capturen y validen sus respectivas estimaciones en los primeros 10 dias de cada mes de la obra */
/* El Superintendente tiene 5 dias para capturar la estimación */
/* El Supervisor tiene 2 dias para validar la estimación */
/* El Residente tiene 3 dias para validar la estimación del supervisor */
CREATE TABLE NOTIFICACION (
    nt_ID char(6),
    nt_Titulo varchar(100),
    nt_Descripcion varchar(255),
    nt_Fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nt_Status boolean, /* 1 = No visto || 0 = Visto */
    nt_Usuario char(6),
    
    PRIMARY KEY (nt_ID),
    FOREIGN KEY (nt_Usuario) REFERENCES USUARIO (us_ID)    
);

/* CAMPOS DE AUDITORIA */
/* CUALQUIER CAMBIO EN LA BASE DE DATOS EN LA TABLA DE PROYECTOS, SE GUARDARÁ AQUÍ */
/* ESTA TABLA SE LLENARÁ ÚNICAMENTE CON TRIGGERS */
CREATE TABLE CAMBIO (
    cb_ID char(6),
    cb_Descripcion varchar(255),
    cb_Fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cb_Usuario char(6),
    
    PRIMARY KEY (cb_ID),
    FOREIGN KEY (cb_Usuario) REFERENCES USUARIO (us_ID)    
);

/*TAREAS*/
CREATE TABLE TAREAS (
    tr_ID char(6),
    tr_Descripcion varchar(255),
    tr_FechaInicio date,
    tr_FechaFin date,
    tr_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    tr_Usuario char(6),

    PRIMARY KEY (tr_ID),
    FOREIGN KEY (tr_Usuario) REFERENCES USUARIO (us_ID)
);

/* TABLAS DE PROYECTO */
/* JERARQUÍA DE PROYECTO: PROYECTO -> FASE DE PROYECTO -> FRENTE DE OBRA */
CREATE TABLE PROYECTO (
    pr_ID char(6),
    pr_Nombre VARCHAR(100),
    pr_FechaInicio date, /*Fecha de inicio que dará el usuario*/
    pr_FechaFin date, /*Fecha de fin que dará el usuario, esta podrá cambiar por retrasos o situaciones de fuerza mayor; el cambio se guardará en la tabla CAMBIO, este podrá cambiar el cálculo de algunas estimaciones*/
    pr_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    pr_CostoTotal float, /*Se calcula con el TOTAL en el catalogo de conceptos*/
    pr_Ubicacion varchar(500),
    pr_Usuario char(6), /*Es el usuario que creo el proyecto*/
    pr_PorcentajeAvance float,
    
    PRIMARY KEY (pr_ID),
    FOREIGN KEY (pr_Usuario) REFERENCES USUARIO (us_ID)
);

ALTER TABLE PROYECTO
	ADD pr_Supervisora char(6);
ALTER TABLE PROYECTO 
	ADD CONSTRAINT fk_Supervisora FOREIGN KEY (pr_Supervisora) REFERENCES SUPERVISORA (spa_ID);

CREATE TABLE FASE_PROYECTO (
    fp_ID char(6),
    fp_Nombre varchar(100), /*Son las diferentes partes en las que se dividirá el proyecto*/
    fp_FechaInicio date, /*Esta deberá entrar en el periodo de creación del proyecto*/
    fp_FechaFin date, /*No puede ser mayor a la fecha fin del proyecto*/
    fp_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    fp_PorcentajeAvance float,
    fp_CatalogoConceptos int(6), /*Es el catalogo de conceptos de cada fase*/
    fp_Proyecto char(6), /*Es el proyecto al que pertenence*/
    
    PRIMARY KEY (fp_ID),
    FOREIGN KEY (fp_Proyecto) REFERENCES PROYECTO (pr_ID),    
	FOREIGN KEY (fp_CatalogoConceptos) REFERENCES CATALOGO_CONCEPTOS (cc_ID) 
);

/*Esta tabla funcionará únicamente como fuente de información en la aplicación web*/
CREATE TABLE FRENTE_DE_OBRA (
    fob_ID char(6),
    fob_Nombre varchar(100), 
    fob_FaseProyecto char(6),
    fob_Contratista char(6),
    
    PRIMARY KEY (fob_ID),
    FOREIGN KEY (fob_FaseProyecto) REFERENCES FASE_PROYECTO (fp_ID),
    FOREIGN KEY (fob_Contratista) REFERENCES CONTRATISTA (cta_ID)
);

/* ES DE LAS TABLAS MÁS IMPORTANTES */
/* SIRVE PARA LA CREACIÓN DE ESTIMACIONES MENSUALES */
/* CON ESTA TABLA SE GENERARÁN REPORTES .pdf */
CREATE TABLE ESTIMACION (
	es_ID char(6),
    es_ImporteContrato float, /*Importe del contrato, esta sale del catalago de conceptos, se utilizara para calculos de importes acumulados, de la estimacion actual, del acumulado actual y el saldo por estimar*/
    es_NetoARecibir float, /*Es la suma del importe de estimacion, la amortizacion del anticipo, el 16% del IVA, la retencion del 0.5% de la S.F.P. y la retencion por atraso de programa*/
    es_FechaInicio date, /*Fecha de inicio de la estimacion, inicio de mes que se tomo para la estimación*/
    es_FechaFin date, /*Fecha de fin de la estimacion, fin de mes que se tomo para la estimación*/
    es_Contratante char(6), /*Es el que creo el proyecto*/
    es_Superintendente char(6), /*Es quien creo la estimacion*/
    es_Supervisor char(6), /*Es quien debe de validarla*/
    es_EstadoSupervisor boolean, /* 1 = Aprobado || 0 = No aprobado */
    es_Residente char(6), /*Es el que valida la estimacion final*/
    es_Proyecto char(6), /*Es para sacar el catalogo de conceptos y obtener el importe de contrato*/
    
    PRIMARY KEY (es_ID),
    FOREIGN KEY (es_Contratante) REFERENCES CONTRATANTE (cte_ID),
    FOREIGN KEY (es_Superintendente) REFERENCES SUPERINTENDENTE (sup_ID),
    FOREIGN KEY (es_Supervisor) REFERENCES SUPERVISOR (sup_ID),
    FOREIGN KEY (es_Residente) REFERENCES RESIDENTE (res_ID),
    FOREIGN KEY (es_Proyecto) REFERENCES PROYECTO (pr_ID)    
);

/* Cada proyecto tiene un catalgo de conceptos */
CREATE TABLE CATALOGO_CONCEPTOS (
	cc_ID char(6),
    
    PRIMARY KEY (cc_ID)
);

/* El catalogo de conceptos se divide en partidas, estas tendrán a los conceptos */
CREATE TABLE PARTIDA (
    pt_ID char(6),
    pt_Nombre varchar(100), /*Con la primeras 2 letras se creara la clave del concepto*/
    pt_CatalogoConceptos char(6),
    
    PRIMARY KEY (pt_ID),
    FOREIGN KEY (pt_CatalogoConceptos) REFERENCES CATALOGO_CONCEPTOS (cc_ID) 
);

CREATE TABLE CONCEPTO (
    cp_ID char(6),
    cp_Clave varchar(100), /*Clave del concepto, ej. Nombre de la Partida = Cimentación -> C[cpID]*/
    cp_Nombre varchar(100),
    cp_Unidad varchar(100),
    cp_Cantidad int,
    cp_PrecioUnitario float,
    cp_Importe float,
    cp_Partida char(6),
    
    PRIMARY KEY (cp_ID),
    FOREIGN KEY (cp_Partida) REFERENCES PARTIDA (pt_ID)     
);

ALTER TABLE CONCEPTO
	ADD cp_CantidadMax int;

/*OPERACIONES CON TRIGGERS PARA EL FUNCIONAMIENTO DE LA BASE*/
/*TRIGGER PARA LOS CAMBIOS DE AUDITORIA CADA QUE SE MODIFIQUE EL PROYECTO*/
-- CREATE TRIGGER `trg_cambio_proyecto` AFTER UPDATE ON `PROYECTO` FOR EACH ROW INSERT INTO CAMBIO (cb_Descripcion, cb_Usuario) VALUES ('Se modifico el proyecto con ID: ' + pr_ID, pr_Usuario);

-- /*TRIGGER CUANDO SE EDITA UN USARIO*/
-- CREATE TRIGGER `trg_cambio_usuario` AFTER UPDATE ON `USUARIO` FOR EACH ROW INSERT INTO CAMBIO (cb_Descripcion, cb_Usuario) VALUES ('Se modifico el usuario: ' + NEW.us_ID, NEW.us_ID);

SELECT * FROM CAMBIO;
SELECT * FROM PROYECTO;
SELECT * FROM PARTIDA;
SELECT * FROM CATALOGO_CONCEPTOS;
SELECT * FROM FASE_PROYECTO;
SELECT * FROM CONCEPTO;
SELECT * FROM USUARIO ;
SELECT * FROM SUPERVISOR;
SELECT * FROM CONTRATANTE;
SELECT * FROM CONTRATISTA;
SELECT * FROM SUPERVISORA;
SELECT * FROM USUARIO_HAS_PROJECTS;
SELECT * FROM ESTIMACION;

-- Crear un usuario para cada tipo de usuario

INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (1,"Gustavo", "Cerda", "Garcia", "2002-09-30", 1, "5527167255", "CEGG020930UX7", "supervisor@mail.com", "1");
INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (2,"Gustavo", "Cerda", "Garcia", "2002-09-30",2, "5527167255", "CEGG020930UX7", "superintendente@mail.com", "1");
INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (3,"Gustavo", "Cerda", "Garcia", "2002-09-30",3, "5527167255", "CEGG020930UX7", "residente@mail.com", "1");
INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (4,"Gustavo", "Cerda", "Garcia", "2002-09-30",4, "5527167255", "CEGG020930UX7", "contratista@mail.com", "1");
INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (5,"Gustavo", "Cerda", "Garcia", "2002-09-30",5, "5527167255", "CEGG020930UX7", "contratante@mail.com", "1");
INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (6,"Gustavo", "Cerda", "Garcia", "2002-09-30",6, "5527167255", "CEGG020930UX7", "replegal@mail.com", "1");
INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (7,"Gustavo", "Cerda", "Garcia", "2002-09-30",7, "5527167255", "CEGG020930UX7", "supervisora@mail.com", "1");
INSERT INTO USUARIO (us_ID,us_Nombre,us_ApPaterno,us_ApMaterno,us_FechaNac,us_Tipo,us_Telefono,us_RFC,us_Email,us_Password) VALUES (8,"Gustavo", "Cerda", "Garcia", "2002-09-30",8, "5527167255", "CEGG020930UX7", "supervisante@mail.com", "1");

DELETE FROM ESTIMACION;