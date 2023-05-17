CREATE DATABASE GeoWess;
USE GeoWess;

DROP DATABASE GeoWess;

/*Todos son usuarios*/
CREATE TABLE USUARIO (
    us_Nombre varchar(50),
    us_ApPaterno varchar(50),
    us_ApMaterno varchar(50),
    us_FechaNac date,
    us_FechaHoraCreacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    us_Tipo int, /* Supervisor, Superintendente, Residente de Servicios, Contratista, Contratante, Representante legal, Supervisante de Servicios, Administrador*/
    us_Telefono int(10),
    us_RFC char(13),
    us_Email varchar(100),
    us_Password varchar(100),
    
    PRIMARY KEY (us_Email)    
);

/*ROLES MENORES*/
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

/*Tienen que estar obligadamente, no tiene ningun poder de crear proyectos, modificar o generar estimaciones, pero puede ver los reportes, estimaciones, etc. */
CREATE TABLE REPRESENTATE_LEGAL (
	rpl_ID int(6),
    rpl_Usuario varchar(100),
    
    PRIMARY KEY (rpl_ID),
    FOREIGN KEY (rpl_Usuario) REFERENCES USUARIO (us_Email)
);

/*ROLES IMPORTANTES*/
/*Ellos pueden ver solamente los proyectos, y las estimaciones mensuales, no pueden modificar ni generar estimaciones*/
CREATE TABLE CONTRATISTA (
	cta_ID int(6),
    cta_RepresentanteLegal int(6),    
    cta_Supervisante int(6),
    cta_Usuario varchar(100),
    
    PRIMARY KEY (cta_ID),
    FOREIGN KEY (cta_RepresentanteLegal) REFERENCES REPRESENTANTE_LEGAL (rpl_ID),
    FOREIGN KEY (cta_Usuario) REFERENCES USUARIO (us_Email),
    FOREIGN KEY (cta_Supervisante) REFERENCES SUPERVISANTE (sup_ID)
);

/*Es quien puede crear los proyectos, editarlos y eliminarlos*/
CREATE TABLE CONTRATANTE (
	cte_ID int(6),
    cte_Usuario varchar(100),
    cte_Residente int(6),
    
    PRIMARY KEY (cte_ID),
    FOREIGN KEY (cte_Usuario) REFERENCES USUARIO (us_Email),
    FOREIGN KEY (cte_Residente) REFERENCES RESIDENTE (res_ID)
);

/*Son quienes llenan reportes diarios, validan la estimacion de la obra mensual*/
CREATE TABLE SUPERVISORA (
	spa_ID int(6),
    spa_Supervisor int(6),
    spa_RepresentanteLegal int(6),
    
    PRIMARY KEY (spa_ID),
    FOREIGN KEY (spa_Supervisor) REFERENCES SUPERVISOR (sup_ID),
    FOREIGN KEY (spa_RepresentanteLegal) REFERENCES REPRESENTANTE_LEGAL (rpl_ID)
);

/* TABLA DE FUNCION DE LOS USUARIOS */
/* Son los mensajes que recibiran los superintendentes, supervisores y residentes para que capturen y validen sus respectivas estimaciones en los primeros 10 dias de cada mes de la obra */
/* El Superintendente tiene 5 dias para capturar la estimación */
/* El Supervisor tiene 2 dias para validar la estimación */
/* El Residente tiene 3 dias para validar la estimación del supervisor */
CREATE TABLE NOTIFICACION (
    nt_ID int(6),
    nt_Titulo varchar(100),
    nt_Descripcion varchar(255),
    nt_Fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nt_Status boolean, /* 1 = No visto || 0 = Visto */
    nt_Usuario varchar(100),
    
    PRIMARY KEY (nt_ID),
    FOREIGN KEY (nt_Usuario) REFERENCES USUARIO (us_Email)    
);

/* CAMPOS DE AUDITORIA */
/* CUALQUIER CAMBIO EN LA BASE DE DATOS EN LA TABLA DE PROYECTOS, SE GUARDARÁ AQUÍ */
/* ESTA TABLA SE LLENARÁ ÚNICAMENTE CON TRIGGERS */
CREATE TABLE CAMBIO (
    cb_ID int(6),
    cb_Descripcion varchar(255),
    cb_Fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cb_Usuario varchar(100),
    
    PRIMARY KEY (cb_ID),
    FOREIGN KEY (cb_Usuario) REFERENCES USUARIO (us_Email)    
);

/* TABLAS DE PROYECTO */
/* JERARQUÍA DE PROYECTO: PROYECTO -> FASE DE PROYECTO -> FRENTE DE OBRA */
CREATE TABLE PROYECTO (
    pr_ID int(6),
    pr_Nombre VARCHAR(100),
    pr_FechaInicio date, /*Fecha de inicio que dará el usuario*/
    pr_FechaFin date, /*Fecha de fin que dará el usuario, esta podrá cambiar por retrasos o situaciones de fuerza mayor; el cambio se guardará en la tabla CAMBIO, este podrá cambiar el cálculo de algunas estimaciones*/
    pr_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    pr_CostoTotal float, /*Se calcula con el TOTAL en el catalogo de conceptos*/
    pr_Ubicacion varchar(500),
    pr_Contratante int(6), /*Es el usuario que creo el proyecto*/
    pr_CatalogoConceptos int(6), /*Es el catalogo de conceptos de todo el proyecto*/
    
    PRIMARY KEY (pr_ID),
    FOREIGN KEY (pr_Usuario) REFERENCES CONTRATANTE (cte_ID),
    FOREIGN KEY (pr_CatalogoConceptos) REFERENCES CATALOGO_CONCEPTOS (cc_ID) 
);

CREATE TABLE FASE_PROYECTO (
    fp_ID int(6),
    fp_Nombre varchar(100), /*Son las diferentes partes en las que se dividirá el proyecto*/
    fp_FechaInicio date, /*Esta deberá entrar en el periodo de creación del proyecto*/
    fp_FechaFin date, /*No puede ser mayor a la fecha fin del proyecto*/
    fp_Status boolean, /* 1 = Finalizada || 0 = En proceso */
    fp_Proyecto int(6), /*Es el proyecto al que pertenence*/
    
    PRIMARY KEY (fp_ID),
    FOREIGN KEY (fp_Proyecto) REFERENCES PROYECTO (pr_ID)     
);

/*Esta tabla funcionará únicamente como fuente de información en la aplicación web*/
CREATE TABLE FRENTE_DE_OBRA (
    fob_ID int(6),
    fob_Nombre varchar(100), 
    fob_FaseProyecto int(6),
    fob_Contratista int(6),
    
    PRIMARY KEY (fob_ID),
    FOREIGN KEY (fob_FaseProyecto) REFERENCES FASE_PROYECTO (fp_ID),
    FOREIGN KEY (fob_Contratista) REFERENCES CONTRATISTA (cta_ID)
);

/* ES DE LAS TABLAS MÁS IMPORTANTES */
/* SIRVE PARA LA CREACIÓN DE ESTIMACIONES MENSUALES */
/* CON ESTA TABLA SE GENERARÁN REPORTES .pdf */
CREATE TABLE ESTIMACION (
	es_ID int(6),
    es_ImporteContrato float, /*Importe del contrato, esta sale del catalago de conceptos, se utilizara para calculos de importes acumulados, de la estimacion actual, del acumulado actual y el saldo por estimar*/
    es_Anticipo float, /*Es el importe del anticipo, se utilizara para calcular el amortizado acumulado anterior, amortizacion actual, amortizado acumulado actual y el saldo por amortizar*/
    es_NetoARecibir float, /*Es la suma del importe de estimacion, la amortizacion del anticipo, el 16% del IVA, la retencion del 0.5% de la S.F.P. y la retencion por atraso de programa*/
    es_FechaInicio date, /*Fecha de inicio de la estimacion, inicio de mes que se tomo para la estimación*/
    es_FechaFin date, /*Fecha de fin de la estimacion, fin de mes que se tomo para la estimación*/
    es_Contratista int(6),
    es_Superintendente int(6), /*Es quien creo la estimacion*/
    es_Supervisor int(6), /*Es quien debe de validarla*/
    es_EstadoSupervisor boolean, /* 1 = Aprobado || 0 = No aprobado */
    es_Residente int(6), /*Es el que valida la estimacion final*/
    es_Proyecto int(6), /*Es para sacar el catalogo de conceptos y obtener el importe de contrato*/
    
    PRIMARY KEY (es_ID),
    FOREIGN KEY (es_Contratista) REFERENCES CONTRATISTA (cta_ID),
    FOREIGN KEY (es_Superintendente) REFERENCES SUPERINTENDENTE (sup_ID),
    FOREIGN KEY (es_Supervisor) REFERENCES SUPERVISOR (sup_ID),
    FOREIGN KEY (es_Residente) REFERENCES RESIDENTE (res_ID),
    FOREIGN KEY (es_Proyecto) REFERENCES PROYECTO (pr_ID)    
);

/* Cada proyecto tiene un catalgo de conceptos */
CREATE TABLE CATALOGO_CONCEPTOS (
	cc_ID int(6),
    
    PRIMARY KEY (cc_ID)
);

/* El catalogo de conceptos se divide en partidas, estas tendrán a los conceptos */
CREATE TABLE PARTIDA (
    pt_ID int(6),
    pt_Nombre varchar(100), /*Con la primeras 2 letras se creara la clave del concepto*/
    pt_CatalogoConceptos int(6),
    
    PRIMARY KEY (pt_ID),
    FOREIGN KEY (pt_CatalogoConceptos) REFERENCES CATALOGO_CONCEPTOS (cc_ID) 
);

CREATE TABLE CONCEPTO (
    cp_ID int(6),
    cp_Clave varchar(100), /*Clave del concepto, ej. Nombre de la Partida = Cimentación -> C[cpID]*/
    cp_Nombre varchar(100),
    cp_Unidad varchar(100),
    cp_Cantidad int,
    cp_PrecioUnitario float,
    cp_Importe float,
    cp_Partida int(6),
    
    PRIMARY KEY (cp_ID),
    FOREIGN KEY (cp_Partida) REFERENCES PARTIDA (pt_ID)     
);


/*OPERACIONES CON TRIGGERS PARA EL FUNCIONAMIENTO DE LA BASE*/
/*TRIGGER PARA LOS CAMBIOS DE AUDITORIA CADA QUE SE MODIFIQUE EL PROYECTO*/
CREATE TRIGGER `trg_cambio_proyecto` AFTER UPDATE ON `PROYECTO` FOR EACH ROW INSERT INTO CAMBIO (cb_Descripcion, cb_Usuario) VALUES ('Se modifico el proyecto con ID: ' + NEW.pr_ID, NEW.pr_Contratante);
