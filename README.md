# aod-back
Este repositorio contiene el código backend para la web aod-home de Aragón Open Data

## Configuración y despliegue de aod-back
Desde el directorio aod-home en el entorno elegido
1. Ejecutar **git clone https://github.com/aragonopendata/aod-back.git**
2. Se habrá creado la carpeta aod-back. Ingresar dentro de la misma
3. Ubicar el archivo .env-template en la raíz del directorio aod-back y hacer una copia del mismo
4. Renombrar el archivo .env-template(copy) como .env
5. Rellenar el archivo .env con los valores correspondientes al entorno en donde se está clonando el proyecto. 
  **Estos valores se encuentran en https://github.com/aragonopendata/infraestructura/tree/master/docs/apps/aod-back**
6. Una vez configurado el arhivo .env con los valores correspondientes, ejecutar **nmp install** para generar el árbol de dependencias
7. Ejecutar **sudo supervisorctl restart launchAOD_BACK**

