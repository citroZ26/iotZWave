var ZWave = require('openzwave-shared');
var os = require('os');

const mariadb = require("mariadb");
const express = require('express');
const app = express();
const cors = require ('cors');

app.use(cors({origin: '*'}));
app.use(express.static('public'));

app.get('/', function(req,res) {
  res.send('Hello express work')
});

app.get('/api',function(req,res){
  var data = {
	capteur1: {
		date: [],
		temperature: [],
		humidite: [],
		luminosite: [],
		uv: []
	},
	capteur2: {
		date: [],
		temperature: [],
		humidite: [],
		luminosite: [],
		uv:[]
	}
  };
  connectToBdd().then(function(conn){
    conn.query("select * from valeurs").then(function(rows){
	rows.meta = undefined;
	rows.map(function(record){
		data.capteur1.date.push(record.date);
		data.capteur1.temperature.push(record.temperature);
		data.capteur1.humidite.push(record.humidite);
		data.capteur1.luminosite.push(record.luminosite);
		data.capteur1.uv.push(record.uv);
	});
    	conn.query("select * from valeurs2").then(function(rows){
		rows.meta = undefined;
		rows.map(function(record){
			data.capteur2.date.push(record.date);
			data.capteur2.temperature.push(record.temperature);
			data.capteur2.humidite.push(record.humidite);
			data.capteur2.luminosite.push(record.luminosite);
			data.capteur2.uv.push(record.uv);
		});
		res.json(data);
    	});
    });
  });
});

app.listen(3000, function(){console.log('wassup')});

function connectToBdd(){
  return mariadb.createConnection({
    host: 'localhost', 
    user:'iotUser',
    database: 'iot'
  })
  .catch(err => {
    console.log("not connected due to error: " + err);
  });
}

var zwave = new ZWave({
  ConsoleOutput: false
});

zwavedriverpaths = {
  "darwin": '/dev/cu.usbmodem1411',
  "linux": '/dev/ttyUSB0',
  "windows": '\\\\.\\COM3'
}

var nodes = [];
var homeid = null;

var nodesValues = [
  {
    nodeid: 18,
    values : [
      {
        temperature: undefined,
        luminance: undefined,
        humidity: undefined,
        uv: undefined
      }
    ]
  },
  {
    nodeid: 19,
    values : [
      {
        temperature: undefined,
        luminance: undefined,
        humidity: undefined,
        uv: undefined
      }
    ]
  }
];

var changedValues = [
  {
    temperature: undefined,
    luminance: undefined,
    humidity: undefined,
    uv: undefined
  },
  {
    temperature: undefined,
    luminance: undefined,
    humidity: undefined,
    uv: undefined
  }
];

zwave.on('connected', function (version) {
  console.log("**** CONNECTED ****")
  console.log("Openzwave version:", version)
});

zwave.on('driver ready', function (home_id) {
  homeid = home_id;
  console.log('scanning homeid=0x%s...', homeid.toString(16));
});

zwave.on('driver failed', function () {
  console.log('failed to start driver');
  process.exit();
});

zwave.on('node added', function (nodeid) {
  if(nodeid==18 || nodeid == 19){
    nodes[nodeid] = {
      manufacturer: '',
      manufacturerid: '',
      product: '',
      producttype: '',
      productid: '',
      type: '',
      name: '',
      loc: '',
      classes: {},
      ready: false,
    };
    console.log("Node %d connected", nodeid);
  }
});

zwave.on('node ready', function (nodeid, nodeinfo) {
  if(nodeid == 18 || nodeid == 19){
  nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
  nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
  nodes[nodeid]['product'] = nodeinfo.product;
  nodes[nodeid]['producttype'] = nodeinfo.producttype;
  nodes[nodeid]['productid'] = nodeinfo.productid;
  nodes[nodeid]['type'] = nodeinfo.type;
  nodes[nodeid]['name'] = nodeinfo.name;
  nodes[nodeid]['loc'] = nodeinfo.loc;
  nodes[nodeid]['ready'] = true;

  console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
    nodeinfo.name,
    nodeinfo.type,
    nodeinfo.loc);

  for (comclass in nodes[nodeid]['classes']) {
    switch (comclass) {
      case 0x25: // COMMAND_CLASS_SWITCH_BINARY
      case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
        zwave.enablePoll(nodeid, comclass);
        break;
    }
    if(comclass == 49) {
      var values = nodes[nodeid]['classes'][comclass];
      console.log('node%d: class %d', nodeid, comclass);
      for (idx in values)
        console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[
          idx]['value']);
    }
  }
}
});


zwave.on('node event', function(nodeid, data){
  if(nodeid == 18 || nodeid == 19){
    console.log('node%d event : Basic set %d', nodeid, data);
  }
});

zwave.on('value added', function (nodeid, comclass, value) {
  if(nodeid == 18 && comclass == 49){

    console.log("Value added event class : " + comclass + " index value : " + value.index);

    if (!nodes[nodeid]['classes'][comclass])
    nodes[nodeid]['classes'][comclass] = {};
    nodes[nodeid]['classes'][comclass][value.index] = value;

    switch(value.index){
      case 1:
        nodesValues[0].values[0].temperature = value.value;
        break;

      case 3:
        nodesValues[0].values[0].luminance = value.value;
        break;

      case 5:
        nodesValues[0].values[0].humidity = value.value;
        break;

      case 27:
        nodesValues[0].values[0].uv = value.value;
        break;
    }
  }

  if(nodeid == 19 && comclass == 49){

    console.log("Value added event class : " + comclass + " index value : " + value.index);

    if (!nodes[nodeid]['classes'][comclass])
    nodes[nodeid]['classes'][comclass] = {};
    nodes[nodeid]['classes'][comclass][value.index] = value;

    switch(value.index){
      case 1:
        nodesValues[1].values[0].temperature = value.value;
        break;

      case 3:
        nodesValues[1].values[0].luminance = value.value;
        break;

      case 5:
        nodesValues[1].values[0].humidity = value.value;
        break;

      case 27:
        nodesValues[1].values[0].uv = value.value;
        break;
    }
  }
});

zwave.on('value changed', function (nodeid, comclass, value) {
  if(nodeid == 18 && comclass == 49){
    
    console.log("Value changed event class : " + comclass + " index value : " + value.index);

    if (nodes[nodeid]['ready']) {
      console.log('node%d: changed: %d:%s:%s->%s', nodeid, comclass,
        value['label'],
        nodes[nodeid]['classes'][comclass][value.index]['value'],
        value['value']);
    }
    nodes[nodeid]['classes'][comclass][value.index] = value;

    var date = new Date().toISOString().replace("T", " ").replace("Z", " ");
    console.log(date);

    switch(value.index){
      case 1:
        changedValues[0].temperature = value.value;
        break;

      case 3:
        changedValues[0].luminance = value.value;
        break;

      case 5:
        changedValues[0].humidity = value.value;
        break;

      case 27:
        changedValues[0].uv = value.value;
        connectToBdd().then(function(conn) {
          conn.query("INSERT INTO valeurs VALUES("
	   + changedValues[0].temperature + ","
           + changedValues[0].luminance + ","
           + changedValues[0].humidity + ","
           + changedValues[0].uv + ","
	   + "'" + date + "')"
           )
           .then(function(res){
              console.log("sent to database");
              console.log(res);
           }).catch(function(err){
              console.log("query error due to " + err);
           });
        }).catch(function(err){
          console.log("not connected to database due to " + err);
        });
        break;
    }

    console.log(changedValues);
  }

  if(nodeid == 19 && comclass == 49){
    
    console.log("Value changed event class : " + comclass + " index value : " + value.index);

    if (nodes[nodeid]['ready']) {
      console.log('node%d: changed: %d:%s:%s->%s', nodeid, comclass,
        value['label'],
        nodes[nodeid]['classes'][comclass][value.index]['value'],
        value['value']);
    }
    nodes[nodeid]['classes'][comclass][value.index] = value;

    var date = new Date().toISOString().replace("T", " ").replace("Z", " ");
    console.log(date);

    switch(value.index){
      case 1:
        changedValues[1].temperature = value.value;
        break;

      case 3:
        changedValues[1].luminance = value.value;
        break;

      case 5:
        changedValues[1].humidity = value.value;
        break;

      case 27:
        changedValues[1].uv = value.value;
        connectToBdd().then(function(conn) {
          conn.query("INSERT INTO valeurs2 VALUES("
	   + changedValues[1].temperature + ","
           + changedValues[1].luminance + ","
           + changedValues[1].humidity + ","
           + changedValues[1].uv + ","
	   + "'" + date + "')"
           )
           .then(function(res){
              console.log("sent to database");
              console.log(res);
           }).catch(function(err){
              console.log("query error due to " + err);
           });
        }).catch(function(err){
          console.log("not connected to database due to " + err);
        });
        break;
    }

    console.log(changedValues);
  }
});

zwave.on('value removed', function (nodeid, comclass, index) {
  if(nodeid == 18){
    if (nodes[nodeid]['classes'][comclass] &&
      nodes[nodeid]['classes'][comclass][index])
      delete nodes[nodeid]['classes'][comclass][index];
    }
    if(nodeid == 19){
      if (nodes[nodeid]['classes'][comclass] &&
        nodes[nodeid]['classes'][comclass][index])
        delete nodes[nodeid]['classes'][comclass][index];
      }
});

zwave.on('notification', function (nodeid, notif) {
  if(nodeid == 18 || nodeid == 19){
    switch (notif) {
      case 0:
        console.log('node%d: message complete', nodeid);
        break;
      case 1:
        console.log('node%d: timeout', nodeid);
        break;
      case 2:
        console.log('node%d: nop', nodeid);
        break;
      case 3:
        console.log('node%d: node awake', nodeid);
        break;
      case 4:
        console.log('node%d: node sleep', nodeid);
        break;
      case 5:
        console.log('node%d: node dead', nodeid);
        break;
      case 6:
        console.log('node%d: node alive', nodeid);
        break;
    }
  }
});

zwave.on('scan complete', function () {
  console.log('====> scan complete');
  zwave.requestAllConfigParams(3);
});

console.log("connecting to " + zwavedriverpaths[os.platform()]);
zwave.connect(zwavedriverpaths[os.platform()]);


process.on('SIGINT', function () {
  console.log(JSON.stringify(nodesValues));
  console.log(JSON.stringify(changedValues));
  console.log('disconnecting...');
  zwave.disconnect(zwavedriverpaths[os.platform()]);
  process.exit();
});
