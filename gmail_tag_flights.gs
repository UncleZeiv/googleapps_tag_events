/* global data */
var present = new Date();
present.setDate(present.getDate() - 3); // arbitrary threshold
var months = {
  Jan: "01", Gen : "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05", Mag : "05",
  Jun: "06", Giu : "06",
  Jul: "07", Lug : "07",
  Aug: "08", Ago : "08",
  Sep: "09", Set : "09",
  Oct: "10", Ott : "10",
  Nov: "11",
  Dec: "12", Dic : "12",
};


function getRyanairSpreadsheet_() {
  var sheetName = Session.getActiveUser().getUserLoginId();
  var activeSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = activeSpreadSheet.getSheetByName(sheetName);
  if (sheet == null)
  {
    sheet = activeSpreadSheet.insertSheet(sheetName);
  }
  sheet.clear();
  return sheet;
}


function getFlightInfo_(parseArray, index, reservation)
{
  var infoObject = [];
  infoObject['from'] = parseArray[index + 1];
  infoObject['to'] = parseArray[index + 2];
  infoObject['weekday'] = parseArray[index + 3];
  var dayStr = parseArray[index + 4];
  var monthStr = months[parseArray[index + 5]];
  infoObject['day'] = parseInt(dayStr, 10);
  infoObject['month'] = parseInt(monthStr, 10);
  infoObject['year'] = 2000 + parseInt(parseArray[index + 6], 10);
  infoObject['isoDate'] = infoObject['year'] + monthStr + dayStr;
  infoObject['iso-date'] = infoObject['year'] + "-" + monthStr + "-" + dayStr;
  infoObject['code'] = parseArray[index + 7];
  infoObject['depart'] = parseArray[index + 8];
  infoObject['arrive'] = parseArray[index + 9];
  infoObject['date'] = new Date(infoObject.year, infoObject.month - 1, infoObject.day);
  infoObject['future'] = present <= infoObject.date;
  infoObject['reservation'] = reservation;
  return infoObject;
}


function writeHeader_(sheet)
{
  sheet.appendRow([
    'thread index',
    'mail date',
    'future flight?',
    'reservation number',
    'flight number',
    'weekday',
    'date',
    'from',
    'leaving at',
    'to',
    'arriving at',
  ]);
  sheet.setFrozenRows(1);
}


function writeFlight_(sheet, t, mex, flightInfo)
{
  sheet.appendRow([
    t,
    mex.getDate(),
    flightInfo.future ? 'valid' : '',
    flightInfo.reservation,
    flightInfo.code,
    flightInfo.weekday,
    flightInfo.date,
    flightInfo.from,
    flightInfo.depart,
    flightInfo.to,
    flightInfo.arrive,
  ]);
}


var rootLabelName = 'flights';
var labelPrefix = rootLabelName + '/';


function assignLabels_(thread, rootLabel, flightInfo)
{
  if (flightInfo.future)
  {
    var labelName = labelPrefix + flightInfo.isoDate + "-" + flightInfo.reservation;
    var label = GmailApp.createLabel(labelName);
    label.addToThread(thread);
    rootLabel.addToThread(thread);
  }
}


function deleteOldLabels_()
{
  var labels = GmailApp.getUserLabels();
  for (var l in labels)
  {
    var label = labels[l];
    if (label.getName().substr(0, labelPrefix.length) == labelPrefix)
    {
      /* very dangerous function... be careful!! */
      label.deleteLabel();
    }
  }
}


function getMaxIndex_(counter)
{
  var maxIndex = '';
  counter[maxIndex] = counter[maxIndex] || 0;
  for (var index in counter)
  {
    if (counter[index] > counter[maxIndex])
    {
      maxIndex = index;
    }
  }
  return maxIndex;
}


function getTableOfRyanairFlights() {
  var ryanair = "itinerary@ryanair.com";
  
  /* matching patterns */
  var reservationRegexp = /:(?:<b>)?\s*([A-Z0-9]{5,8})(?:<\/b><\/p>)?/;
  var flightInfoPattern = "(?:<p>)?\\s*.*\\(([A-Z]{3})\\).*\\(([A-Z]{3})\\)(?:<br>)?\\s*(\\w+), (\\d\\d)(\\w+)(\\d\\d)\\s*.*(FR ?\\d+).*(\\d\\d:\\d\\d).*(\\d\\d:\\d\\d)(?:</p>)?";
  flightInfoPattern = flightInfoPattern + "\\s*(?:<p>)?[A-Z ]+(?:</p>)?\\s*(" + flightInfoPattern + ")?";
  var flightInfoRegexp = new RegExp(flightInfoPattern, 'm');
  
  deleteOldLabels_();
  
  var sheet = getRyanairSpreadsheet_();
  writeHeader_(sheet);
  var threads = GmailApp.search(ryanair); // TODO: handle paging
  var rootLabel = GmailApp.createLabel(rootLabelName);
  var counter = [];
  for (var t in threads)
  {
    if (threads[t].getLastMessageDate().getFullYear() < 2011)
    {
      continue;
    }
    
    threads[t].removeLabel(rootLabel);
    
    var messages = threads[t].getMessages();
    for (var m in messages)
    {
      var mex = messages[m];
      /*
TODO: config
      if (mex.getFrom() != ryanair)
      {
        continue;
      }
      */
      
      counter[mex.getTo()] = (counter[mex.getTo()] || 0) + 1;
      
      var body = mex.getBody();
      body = body.replace(/<br \/>/g, '');
      var reservation = reservationRegexp.exec(body);
      if (reservation == null)
      {
        sheet.appendRow([t, mex.getDate(), 'NO MATCH FOUND (reservation number)']);
        continue;
      }
      
      var flightInfo = flightInfoRegexp.exec(body);
      if (flightInfo == null)
      {
        sheet.appendRow([t, mex.getDate(), 'NO MATCH FOUND (flight information)']);
        continue;
      }
      
      var fi = getFlightInfo_(flightInfo, 0, reservation[1]);
      writeFlight_(sheet, t, mex, fi);
      assignLabels_(threads[t], rootLabel, fi);
      
      if (flightInfo[10] != null)
      {
        var fi = getFlightInfo_(flightInfo, 10, reservation[1]);
        writeFlight_(sheet, t, mex, fi);
        assignLabels_(threads[t], rootLabel, fi);
      }
    }
  }
  
  if (Session.getActiveUser().getUserLoginId() == '')
  {
    var newName = getMaxIndex_(counter);
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var otherSheet = activeSpreadsheet.getSheetByName(newName);
    if (otherSheet != sheet)
    {
      if (otherSheet != null)
      {
        activeSpreadsheet.setActiveSheet(otherSheet);
        activeSpreadsheet.deleteActiveSheet();
      }
      sheet.setName(newName);
    }
  }
} 

