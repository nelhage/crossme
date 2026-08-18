# CrossMe -- A realtime collaborate crossword-puzzle app

- See @ARCHITECTURE.md for details on the application's high-level architecture. All changes must be in line with this architecture; any changes which go against or alter this architecture require explicit human approval.

## Instructions

- As of this note, crossme is **deployed in beta**. There is live data in the production database, so any change to the SQL schema must ship with an appropriate migration in `repo/migrate.go` (see @ARCHITECTURE.md); never edit an existing migration in place.
  - The dataset is small, so migrations do not need to be written carefully for performance. A straightforward `ALTER TABLE`, or even a full table rewrite, is fine; there is no need for batching, online-migration tricks, or index-building gymnastics.
  - We do **not** care about compatibility between clients and older servers, or between servers and older clients: the client and server are deployed together, and clients reload. Feel free to make breaking changes to the wire protocol, protobuf messages, or API surface in a single change. Flag such changes to the user, but be willing to make them if it makes sense.
- Commit your work. Commit your work after each completed unit of work. If you've completed a logical chunk of work and are returning control to the user, and you are not asking a substantial design question or direction about how to complete the current task, you should probably have made a commit.
