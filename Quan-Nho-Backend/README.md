# Quan Nho Backend

The PostgreSQL schema lives in [`database/database.sql`](database/database.sql). It creates and updates tables only; it does not insert demo users, menu items, orders, or settings. Add the real owner account and business records to PostgreSQL before signing in. Hibernate validates the schema at startup; it does not create or change tables.

The default connection is `jdbc:postgresql://localhost:5432/POS_QUAN_NHO` with PostgreSQL user `postgres`. For a local run, activate the `local` profile. Its password file at `config/application-local.properties` is ignored by Git and stays outside the packaged JAR:

```powershell
$env:SPRING_PROFILES_ACTIVE = 'local'
mvn spring-boot:run
```

Run from the backend directory. If Maven is not on `PATH`, run `QuanNhoBackendApplication` in IntelliJ with active profile `local`. The Maven wrapper has a path-encoding issue in this Windows workspace.

After the backend starts, open Swagger UI at `http://localhost:8080/swagger-ui/index.html`. The OpenAPI document is available at `http://localhost:8080/v3/api-docs`. These documentation routes are public; the business API endpoints still require authentication.

Set `DB_URL` and `DB_USERNAME` if your host, port, database, or PostgreSQL user differs. Outside this machine, use `DB_PASSWORD` instead of the local profile. A successful startup validates the mapping against the selected database. If the database is unavailable or its tables differ from the entities, startup fails without changing the schema.
