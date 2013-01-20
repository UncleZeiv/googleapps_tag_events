gmail tag flights
=================

A Google Apps Script (script.google.com) to find booked flights in your email, list them in a Google Spreadsheet and tag them with a date in Gmail. The tags are removed a few days after the flight date has passed.

Currently supported flight bookings
-----------------------------------
ryanair.co.uk
ryanair.it

Status
------
The script in this current primitive form has been running on a few accounts for several months now. The plan is to generalize it and make it configurable per user. Contributions are welcome.

How to install and use
----------------------
Create a Google Spreadsheet. From Tools > Script Editor, paste the code and set getTableOfRyanairFlights as the default script function.

From Resources > Current script's triggers, set a time-driven trigger to execute this script periodically.

Author
------
Davide Vercelli, unclezeiv@kerid.org
http://unclezeiv.kerid.org
