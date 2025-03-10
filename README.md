# 🚀 Dokumentacja API (NestJS + Prisma)

## 🔑 Tworzenie użytkownika (admina)

Wyślij zapytanie POST (np. Postman):

POST http://localhost:3000/users

{ "username": "admin1", "password": "secret123", "role": "ADMIN" }

yaml
Kopiuj
Edytuj

- Tworzy użytkownika z rolą administratora.
- Hasło jest przechowywane jako hash.

---

## 🔐 Logowanie użytkownika

Endpoint:

POST /auth/login

css
Kopiuj
Edytuj

Przykład body:

```json
{
  "username": "admin1",
  "password": "secret123"
}
W odpowiedzi otrzymasz JWT:

json
Kopiuj
Edytuj
{
  "access_token": "TOKEN_JWT"
}
Token zawiera w payload:

json
Kopiuj
Edytuj
{
  "username": "admin1",
  "sub": 1,
  "role": "ADMIN"
}
🛡 Dostęp do endpointów chronionych rolami
Przykładowy endpoint dostępny wyłącznie dla roli ADMIN:

pgsql
Kopiuj
Edytuj
GET /admin
Wysyłaj w nagłówku zapytania:

makefile
Kopiuj
Edytuj
Authorization: Bearer <TOKEN_JWT>
Przykładowa odpowiedź przy poprawnym tokenie:

json
Kopiuj
Edytuj
{
  "message": "This is admin-only data",
  "user": {
    "userId": 1,
    "username": "admin1",
    "role": "ADMIN"
  }
}
🔄 Opis procesu autoryzacji
Tworzenie konta

Endpoint: POST /users
json
Kopiuj
Edytuj
{
  "username": "admin1",
  "password": "secret123",
  "role": "ADMIN"
}
Logowanie

Endpoint: POST /auth/login
json
Kopiuj
Edytuj
{
  "username": "admin1",
  "password": "secret123"
}
Odpowiedź:
json
Kopiuj
Edytuj
{
  "access_token": "<TOKEN>",
}
Zapytanie do endpointu chronionego rolą

bash
Kopiuj
Edytuj
GET /admin
Authorization: Bearer <TOKEN>
Przykładowa odpowiedź:

json
Kopiuj
Edytuj
{
  "adminData": "This is admin-only data",
  "user": {
    "userId": 1,
    "username": "admin1",
    "role": "ADMIN"
  }
}
🛡️ Weryfikacja ról – jak to działa technicznie?
@UseGuards(AuthGuard('jwt')) – weryfikuje poprawność tokenu JWT.
@Roles('ADMIN') – ustawia wymaganą rolę.
RolesGuard – sprawdza, czy user.role === 'ADMIN'.
Tym sposobem masz pewność, że endpoint jest dostępny tylko dla autoryzowanych użytkowników z odpowiednią rolą.