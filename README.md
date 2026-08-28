# Propuesta TP DSW

## Grupo
### Integrantes
* 55306 - Peirone Iracelay, Bruno Santino
* 53797 - Rueda, Ezequiel Matias

### Repositorios
* [frontend app](https://github.com/ezewheel/dsw-front)
* [backend app](https://github.com/ezewheel/dsw-back)

## Tema
### Descripción
El sistema consiste en una plataforma para calificar música. Le dará al usuario la posibilidad de buscar artistas, álbumes y canciones y puntuar y opinar sobre los mismos. Funcionará como una red social donde los usuarios podrán consultar las puntuaciones y opiniones propias y de otros usuarios, asi como seguir a otros usuarios para ser notificados sobre las reseñas que éstos dejaron.

### Modelo
![imagen del modelo](https://raw.githubusercontent.com/ezewheel/dsw-back/refs/heads/main/domain_model.png)

*Nota: revisar https://refactoring.guru/design-patterns/strategy para diseño de opinión y puntuación.

## Alcance Funcional 

### Alcance Mínimo

#### Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Usuario<br>2. CRUD Artista*|
|CRUD dependiente|1. CRUD Canción* {depende de} CRUD Artista|
|Listado<br>+<br>detalle| 1. Listado de álbumes filtrado por artista, muestra imagen, nombre, cantidad de canciones y fecha de lanzamiento => detalle muestra la información del álbum y el listado de canciones que lo componen.<br>|
|CUU/Epic|1. Puntuar un artista/canción

*Nota: Artista y Canción se crean para guardar su puntuación y opiniones. Su información se traerá de una API externa.


#### Aprobación:
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Álbum {depende de} CRUD Canción<br>2. CRUD Interacción {depende de} CRUD Artista/Álbum/Canción|
|CUU/Epic|1. Publicar opinión de una canción<br>2. Calificar (upvote/downvote) opinión de una canción<br>3. Agregar Artista/Álbum/Canción a lista de favoritos|


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Listado de canciones filtrado por álbum, muestra título y duración => detalle muestra la información y las opiniones de la canción.<br>2. Opiniones y puntuaciones de todos los usuarios seguidos en una misma ventana (similar al feed de las redes sociales).|
|CUU/Epic|1. Ver opiniones de Usuario<br>2. Ver puntuaciones de Usuario<br>3. Ver favoritos de Usuario|
|Otros| 1. CRUD Seguir (Usuario)
