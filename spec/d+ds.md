### **NOTE:** This document is NOT intended to be viewed as a formatted Markdown file!
**Please click the `</>` button above to turn it into a monospaced, syntax-highlighted-but-otherwise-plaintext document.**

----

``Documentation and design specification`` for booksy-db

__[DESIGN SPEC]__
### NAVIGATION ###
   >> All navigation should be handled by way of "nav" elements, i.e. headers and sidebars.
      The main application header is of course the most prominent of these, right after it
      being the home-page sidebar then the headers found in the "Manage location" and
      "dashboard/My media" subsections thereof.
### ACCESSIBILITY ###
   >> The application should be responsive to some extent; Angular works great on mobile
      browsers, and it'd be awful of me not to take advantage of that, so most content will
      follow a CSS media rule to scale itself down if the screen gets small.
### COLOR SCHEME ###
   >> The default is just an amalgam of greys, but I hope in the future to allow libraries
      to choose two or three of their own colors; to match their school's team colors, for
      instance... colors should not NOT be jarring or overly-contrasting in any way, since
      the foremost goal is of course readability.
  >> The difference in color between the header background and an active routerLink's in it
     is 3682091, and the difference between the header background and an *:active* (ie
     a being-clicked) header button is 7303023.

__[CONCEPTS]__
![!][NOTE:] These are the abstract ideas and terms utilized in the rest of the documentation.
![!][CONT:] Skip to [LOGIN] for the start of the program-flow explication.
### [GLOSSARY] OF TERMS ###
   > User:
      Any person utilizing the application, regardless of what they do with it.
   > Chieftain:
      Blanket term for a user allowed some degree of administrative freedom.
      This applies by default to the Administrator and Organizer roles.
   > Member:
      Anyone registered in the database as a library patron.
   > Administrator, Organizer, Subscriber:
      The three roles present by default. See [ROLES] for more explanation.
   > Media:
      Anything the library may offer to members, as defined by the location's
      administrator(s). By default, this is limited to "book".
   > Item:
      Any single piece of media.
   > Location, library:
      Interchangeable terms used to refer to a public institution that utilizes
      this application to manage media distribution.
### [ROLES] ###
   >> Roles are permission groups assigned to users that determine the degree of freedom
      to which they are allowed to use the application. There are three default
      roles, described below.
   ----
   > Administrator:
      The top dog of the role hierarchy.
      These users are able to manage the location's info (name, picture, color scheme, etc)
      and to create roles with the ability to create other roles. They also have all the
      permissions given to lower roles, sans managing users' accounts (besides deletion).
   > Organizer:
      Users with permission to manage members and add new media to the database.
   > Subscriber:
      Users with just the ability to manage their own account and check out media.
### THE [DATABASE] ###
   >> Everything to do with libraries and their status will be stored in a
      postgreSQL database (the same DB provisioned by Heroku to its users).
      An in-memory Redis database is also used to store users' refresh tokens.
      The Postgres DB will contain five tables; the primary keys `lid, mid, rid, uid` represent
      respectively Location ID, Media ID, Role ID, and User ID, where user is synonymous with
      member. The tables are described below:
   ----
   > locations:
      Every single library currently registered with Booksy, with record of their
      IP address and/or subnet (whichever applicable).
         ╔══════════════════════╦═══════════╦══════╦═══════╦══════════╦═══════════════════╦═══════════════════╗
         ║ lid (PRIMARY KEY)    ║ name      ║ ip   ║ state ║ fine_amt ║ fine_interval     ║ media_types       ║
         ╠══════════════════════╬═══════════╬══════╬═══════╬══════════╬═══════════════════╬═══════════════════╣
         ║ BIGSERIAL            ║ TEXT      ║ TEXT ║ TEXT  ║ MONEY    ║ INT               ║ TEXT[]            ║
         ║ (unique location ID) ║ (location ║      ║       ║ (amt to+ ║ (wait X many days ║ (default [book],  ║
         ║                      ║ name)     ║      ║       ║ fine by) ║ to increase fine) ║ items in library) ║
         ╚══════════════════════╩═══════════╩══════╩═══════╩══════════╩═══════════════════╩═══════════════════╝
   > members:
      Data for every single patron across libraries. LID and UID are composite unique.
         ╔════════════════════╦═══════════╦═══════════╦═════════════╦══════════╦════════════╦══════════════════╦════════════════╦═══════════╦════════════╦═══════╦═══════╗
         ║ uid (PRIMARY KEY)  ║ username [U] lid      ║ fullname    ║ email    ║ phone      ║ manages          ║ rid            ║ pwhash    ║ type       ║ limits ║ locks ║ (custom values; they override role limits+locks, but are overridden by item limits)
         ╠════════════════════╬═══════════╬═══════════╬═════════════╬══════════╬════════════╬══════════════════╬════════════════╬═══════════╬════════════╬═══════╬═══════╣
         ║ BIGSERIAL          ║ TEXT UNIQ ║ BIGINT    ║ TEXT        ║ TEXT     ║ TEXT       ║ BOOL             ║ BIGINT         ║ TEXT      ║ SMALLINT   ║ BINT  ║ BINT  ║
         ║ (unique member ID) ║ DEFAULT   ║ (location ║ (full name) ║ (email   ║ (phone #   ║ (can they manage ║ (ID of this    ║ (bcrypted ║ (user acc  ║ <= 0 for member, 1 for library
         ║                    ║ NULL      ║ id)       ║             ║ or null) ║ or null)   ║ this location?)  ║ member's role) ║ password) ║ or school) ║ <= `manages` will ALWAYS be false for library accounts
         ╚════════════════════╩═══════════╩═══════════╩═════════════╩══════════╩════════════╩══════════════════╩════════════════╩═══════════╩════════════╩═══════╩═══════╝
   > items:
      Every single item in every registered library, with records of their
      location and checkout data if applicable (else NULL).
      An automatic "Heroku Scheduler" job will update the `fines` field every midnight by comparing the current date to the due date.
         ╔═══════════════════════╦════════════╦════════════════════╦══════════════╦═══════╦════════╦═══════════╦══════════════╦══════════════╦════════════╦═════════════════╦════════════╦══════════════════╗
         ║ mid (PRIMARY KEY      ║ type       ║ isbn               ║ lid          ║ title ║ author ║ published ║ issued_to    ║ due_date     ║ fines      ║ acquired        ║ genre      ║ limits            ║
         ╠═══════════════════════╬════════════╬════════════════════╬══════════════╬═══════╬════════╬═══════════╬══════════════╬══════════════╬════════════╬═════════════════╬════════════╬══════════════════╣
         ║ BIGSERIAL             ║ TEXT       ║ TEXT               ║ BIGINT       ║ TEXT  ║ TEXT   ║ DATE      ║ BIGINT       ║ DATE         ║ MONEY      ║ TIMESTAMP       ║ TEXT       ║ BIGINT           ║
         ║ (internal ID of item) ║ ('book' or ║ (maybe bigint)     ║ (internal id ║       ║        ║           ║ (user ID, or ║ (determined  ║ (overdue   ║ (when this copy ║ (app sorts ║ (per-item limits, ║ <= value of 254 == defer to role limits
         ║                       ║ whatever)  ║ (null if not book) ║ of location) ║       ║        ║           ║ NULL if not  ║ according to ║ fines on   ║ was added to    ║ by type &  ║ overrides role   ║ <= 254 is default ofc
         ║                       ║            ║                    ║              ║       ║        ║           ║ checked out) ║ user's role) ║ this item) ║ the location)   ║ genre)     ║ limits)           ║
         ╚═══════════════════════╩════════════╩════════════════════╩══════════════╩═══════╩════════╩═══════════╩══════════════╩══════════════╩════════════╩═════════════════╩════════════╩══════════════════╝
   > holds:
      Holds for every item, with the item's ID and ID of the user placing it on hold.
      Composite primary key between MID, UID, and LID. Also a timestamp 30 days in
      the future from its creation date showing when to remove it from the DB.
         ╔═══════════╦═════════════╦═════════════╦═════════════╗
         ║ mid (PK)  ║ uid (PK)    ║ lid (PK)    ║ deadline    ║
         ╠═══════════╬═════════════╬═════════════╬═════════════╣
         ║ BIGINT    ║ BIGINT      ║ BIGINT      ║ TIMESTAMP   ║
         ║ (item id) ║ (member id) ║ (loc id)    ║             ║
         ╚═══════════╩═════════════╩═════════════╩═════════════╝
   > roles:
      Every role registered, with record of its perms and name.
         ╔═══════════════════╦═══════════╦═════════════╦════════════════╦═══════════════╦═══════════════╗
         ║ rid (PRIMARY KEY) ║ lid       ║ name        ║ permissions    ║ limits         ║ locks         ║
         ╠═══════════════════╬═══════════╬═════════════╬════════════════╬═══════════════╬═══════════════╣
         ║ BIGSERIAL         ║ BIGINT    ║ TEXT        ║ SMALLINT       ║ BIGINT        ║ BIGINT        ║
         ║ (role ID)         ║ (location ║ (role name) ║ (packed field; ║ (four 1-byte  ║ (two 1-byte   ║
         ║                   ║ id)       ║             ║ binary perms)  ║ numbers; more ║ numbers; more ║
         ║                   ║           ║             ║                ║ reserved)     ║ reserved)     ║
         ╚═══════════════════╩═══════════╩═════════════╩════════════════╩═══════════════╩═══════════════╝
   >>The "permissions" packed byte field is as follows.
      1st bit: Manage location info
         Change things like the location's name, color scheme, and picture.
      2nd bit: Manage accounts
         Self-explanatory.
      3rd bit: Manage roles
         Self-explanatory.
      4th bit: Create administrative roles
         Allow user to give roles this same permission.
      5th bit: Manage media
         Add and remove books from the system as well as changing titles & metadata.
      6th bit: Generate reports
         View & generate various status reports
       7th bit: Return items
         Check issued media back into the system
      *__Further bits are reserved for future use.__*
      __Ergo:__ A value of 91, binary [1011011], in the first five bytes would mean that:
         This role CAN manage location info.
         This role CANNOT create & delete accounts.
         This role CAN create & delete other roles.
         This role CAN manage roles & permissions.
         This role CANNOT manage media.
         This role CAN view & generate reports.
         This role CAN return items.
      Default values: [111111] for Admin, [0110111] for Organizer, [000000] for Subscriber.
   >>The "limits" packed big-integer field is as follows.
     NOTE that a value of 255, binary [11111111], in any one byte field is interpreted
     as *infinity* -- i.e. no limit -- and a value of 254 is 'null', telling the backend
     to look one level up for the proper values.
     NOTE also that the values are 'flipped' due to little-endianness.
     NOTE lastly that all limits can be additionally customized per-item
      1st byte: CHECKOUT DURATION (WEEKS)
           The maximum amount of time this role may check out an item for.
           Can also customize per media category.
      3rd byte: MAX RENEWALS
           The maximum amount of due-date renewals afforded to this role.
           Can also customize per media category.
      4th byte: MAX HOLDS
           The maximum amount of holds this role is allowed to use.
      *__Further bytes are reserved for future use.__*
      __Ergo:__ A value of ???, binary [00000011 00000001], in
      the first three bytes would mean that:
         This role can check out items for a maximum of 1 (00000010) week.
         This role can renew media a maximum of 3 (00000011) times.
      Default values: [255 255] for Admin, [4 4] for Organizer, [2 2] for Subscriber.
   >>The "locks" packed big-integer field is as follows. An account lock, once instated, will
     remain active until the user reverses the circumstances that effected it. (This may
     mean returning a book, paying off a fine, re-verifying their account, ...)
     NOTE again that a value of 255, binary [11111111], in any one byte field is interpreted
     as *infinity* -- i.e. no limit -- and a value of 254 is 'null', telling the backend
     to look one level up for the proper values.
     NOTE yet further that the values are little-endian and so are 'flipped'.
      1st byte: CHECKOUT THRESHOLD
         Maximum amount of items this role may check out at a time
         before being barred from checking out new media.
      2nd byte: FINE THRESHOLD (USD)
         Maximum amount of USD in fines allowed before an account with
         this role is barred from checking out new media.
      *__Further bytes are reserved for future use.__*
       __Ergo:__ A value of 3870, binary [00001111 00011110], in the first
       two bytes would mean that:
          This role can check out a maximum of 30 items concurrently.
          This role can incur a maximum of $15 at a time in overdue fines.
### [OVERDUE ITEMS] ###
   Each time an item is accessed by a user wiht 
### [ACCOUNT CREATION] ###
   Accounts can be created either by a user themself or by an administrator.
   If a user makes their own account (which will probably be disabled for the
   FBLA demo) they will have to register with a school in order to use it
   to check out, the logistics of which I haven't figured out entirely yet...

__[LOGIN]__
> Users, if in a registered IP or subnet, will be presented with their
institution's chosen logo & colour scheme and a prompt to log in with
their credentials (usually consisting of an ID or username and a password).
   1. If the user does not have an account, they should request an
      administrator to follow [CONCEPTS][ACCOUNT CREATION] for them.
   2. If the user is not on a registered IP or IP subnet, they will still
      be given the option to log in - just with a generically-themed signup
      page. On entry and afterward, their user experience will be identical to that
      of somebody logging in from their library's Booksy page.
      (THIS IS THE OPTION GIVEN FOR THE FBLA DEMO)

When the user logs in, they will be given a session token and login info, passed around
by Sanic at the backend. The Angular service that generates the sidebar buttons will then
(depending on the user's login credentials) fetch the appropriate sidebar buttons and
in turn allow access to the appropriate pages.

**HOME**
![!][NOTE:] The following text makes a distinction between a *chieftain* and an *operator*.
![!][CONT:] See [CONCEPTS][GLOSSARY] and [CONCEPTS][ROLES] for more explanation.
![!][CONT:] In some cases, their duties will overlap. *Operator* in all contexts here can
![!][CONT:] be replaced by *chieftain*, but not always vice-versa.

> The "home page" tab is really a collection of pages, defaulting to [BOOK CHECKOUT] but with
other pages being shown in the sidebar. Depending on the user's permissions, certain sections
(indicated by the ![PERMISSIONS][X] line) may not be shown.
### [BOOK CHECKOUT] (default page) ###
   > ![PERMISSIONS][N/A]
   >> The checkout page, being likely the biggest reason anybody would want to use this
      application, will be redirected to immediately after login. Other pages, which
      will be expanded on below, are sectioned off to the sidebar.
   ----
   1. During checkout, members will firstly be requested to enter their
      unique ID or username in a field presented on the operator's screen.
         #) If the member is unable to produce an ID or username, a chieftain
            is able to look them up in the database by first and last name or
            by any other potentially-identifying traits.
            If the user cannot be found in the database, the chieftain can
            go through the process of creating an account for them.
   2. Subsequently, the operator will be able to scan or enter manually the
      unique ID of the requested media in yet another field on the checkout
      screen.
         #) If the requested media for whatever reason has no accessible
            barcode, then a chieftain may be called over to remove it
            from circulation
         #) If the requested media cannot presently be found in the
            database BUT the user would like to donate it, then a
            chieftain has the ability to add it into the system; the web
            application will provide and store a newly-generated ID for
            it "on the spot".
               a. In doing so, the chieftain must provide its:
                     1. Title,
                     2. Author or creator's name,
                     3. Media type (from a dropdown), and
                     4. Date of publication (if applicable).
                  They can also provide a picture, although this will
                  probably not be feasible in a time-crunched scenario
                  and so is optional.
               b. The chieftain will then have the option of printing
                  out the newly-generated barcode, or writing it down,
                  or even just leaving it alone to be added to the book
                  later. (Last option is not recommended)
   3. When both fields are filled out and the "Enter" or "Submit" button
      is pressed, the media is sent to the server to be recorded in the
      database.
         #) If the media is already checked out and to the same member,
            the operator will have the choice of either returning or
            renewing it. Renew limits will be defined per role, but
            are able to be overriden on a per-item basis.
         #) If the user is unable to check out the book - say, because
            they have too many active books checked out or a large
            amount of overdue fines - the server will return an error
            to be displayed on the webpage, and the checkout will not
            be accepted.
         #) If the book is not found in the database, another error
            will be returned, with the option to retype the ID or
            add the book to the database.
   4. User ID will persist for subsequent checkouts in the same session.

### [MY ACCOUNT] ###
   > ![PERMISSIONS][N/A]
   >> This page facilitates the modification of account settings, such as
      name, email/phone number, etc.
### [MY ITEMS] ###
   > ![PERMISSIONS][N/A]
   >> The dashboard. Shows info about all a user's checked-out items; may
      expand in the future to include favorites or whatever.
### [REPORTS] ###
   > ![PERMISSIONS][CHIEFTAIN]
   >> Generate reports of checkouts and missing books and the like.
### [ROLES] ###
   > ![PERMISSIONS][MANAGE ROLES]
   >> View & edit roles for this location.
### [ACCOUNTS] ###
   > ![PERMISSIONS][ADMIN]
   >> View & manage accounts + roles for this location.
### [LOCATION] ###
   > ![PERMISSIONS][ADMIN]
   >> View & manage location info, including name, color scheme, picture...

**HELP**
> Help pages having to do with managing and using Booksy. May differ per role.

**ABOUT**
> A miscellaneous "about" page intended for the convenience of FBLA viewers.
Single-page, contains links to GitHub repo and AngularJS information and the
suchlike.
