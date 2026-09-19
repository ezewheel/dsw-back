# Propuesta TP DSW

## Grupo

### Integrantes

- 55306 - Peirone Iracelay, Bruno Santino
- 53797 - Rueda, Ezequiel Matias

### Repositorios

- [frontend app](https://github.com/ezewheel/dsw-front)
- [backend app](https://github.com/ezewheel/dsw-back)

## Tema

### Descripción

El sistema consiste en una plataforma para opinar sobre música. Le dará al usuario la posibilidad de buscar artistas, álbumes y canciones y puntuar y reseñar las mismas. Funcionará como una red social donde los usuarios podrán consultar las puntuaciones y reseñas propias y de otros usuarios, asi como seguir a otros usuarios para ser estar al tanto de las puntuaciones y reseñas que estos dejaron.

### Modelo

![imagen del modelo](https://raw.githubusercontent.com/ezewheel/dsw-back/refs/heads/develop/domain_model.png)

## Alcance Funcional

### Alcance Mínimo

#### Regularidad:

| Req                     | Detalle                                                                                                                                                                                                                                                                                                                                                   |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRUD simple             | 1. CRUD Usuario<br>2. CRUD EntidadMusical\*                                                                                                                                                                                                                                                                                                               |
| CRUD dependiente        | 1. CRUD Interacción {depende de} CRUD EntidadMusical y CRUD Usuario                                                                                                                                                                                                                                                                                       |
| Listado<br>+<br>detalle | 1. Listado de álbumes filtrado por artista, muestra imagen, nombre, cantidad de canciones y puntuación => detalle muestra listado de canciones, información del álbum, las reviews de los usuarios.<br>2. Listado de canciones filtrado por álbum muestra título, duración y puntuación => detalle muestra las reseñas de los usuarios de la canción.<br> |
| CUU/Epic                | 1. Puntuar y reseñar una entidad musical                                                                                                                                                                                                                                                                                                                  |

\*Una entidad musical es un artista, álbum o canción

\*Nota: las entidades musicales se crean para guardar su puntuación y opiniones. Su información se traerá de una API externa.

#### Aprobación:

| Req      | Detalle                                                                                                           |
| :------- | :---------------------------------------------------------------------------------------------------------------- |
| CRUD     | 1. CRUD Seguimiento {depende de} CRUD Usuario<br>2. CRUD Favorito {depende de} CRUD Usuario y CRUD EntidadMusical |
| CUU/Epic | 1. Ver listado de puntuaciones y reseñas de usuarios seguidos y entidades musicales favoritas<br>                 |

### Alcance Adicional Voluntario

| Req      | Detalle |
| :------- | :------ |
| Listados | 1.      |
| CUU/Epic | 1.      |
| Otros    | 1.      |
