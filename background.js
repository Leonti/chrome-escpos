chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    innerBounds: {
      width: 400,
      height: 400
    },
    id: "UsbPosPrinter"
  });
});

var port = 0;
var endpoint = 0x02;
var deviceInfo = { vendorId: 0x0416, productId: 0x5011};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'version') {
        sendResponse({ version: '0.1' });
    } else if (message.type === 'print') {        
        requestAndPrint(message.lines);
    }
});

chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
    if (message.type === 'version') {
        sendResponse({ version: '0.1' });
    } else if (message.type === 'print') {        
        requestAndPrint(message.lines);
    }
});

String.prototype.toBytes = function() {
    var arr = []
    for (var i=0; i < this.length; i++) {
        arr.push(this[i].charCodeAt(0))
    }
    return arr
}

var print = function(printer, lines) {

    var encodedLines = [];
    for (var i = 0; i < lines.length; i++) {
        
        var line = lines[i].toBytes().concat([0x01B, 0x64, 10]);
        var encodedLines = encodedLines.concat(line)
    }

        var buffer = new Uint8Array(encodedLines).buffer;

        var data = {
	        direction : "out",
	        endpoint : endpoint,
	        data : buffer
        };
        chrome.usb.bulkTransfer(printer, data, function(response) {
	        if (response.resultCode == 0) {
		        console.log("Success!");
	        } else {
		        console.log("Error", response);
	        }
        });

    chrome.usb.releaseInterface(printer, port, function() {
          console.log('device released');
    });
}

var gotPermissions = function(deviceCallback) {
    chrome.usb.findDevices(deviceInfo, function(devices) {
	    if (devices && devices.length > 0) {
		    // use the first found device
		    var foundDevice = devices[0];
		    // now lets reset the device
		    chrome.usb.resetDevice(foundDevice, function() {
			    // perform some error checking to make sure we
			    // reset the device
			    if (!chrome.runtime.lastError) {
				    
                    // now claim the interface using the port we
				    // specified
				    chrome.usb.claimInterface(foundDevice, port, function() {
					    if (!chrome.runtime.lastError) {
						    deviceCallback(foundDevice);
					    } else {
						    throw chrome.runtime.lastError.message;
					    }
				    })
			    } else {
				    throw chrome.runtime.lastError.message;
			    }
		    });

	    } else {
		    console.warn("Device not found!!");
	    }
    });
};

var permissionObj = {permissions: [{'usbDevices': [deviceInfo] }]};

function requestAndPrint(lines) {
  chrome.permissions.request( permissionObj, function(result) {
    if (result) {
      console.log('Have permissions');
      gotPermissions(function(printer) {
            print(printer, lines);
      });
    } else {
      console.log('App was not granted the "usbDevices" permission.');
      console.log(chrome.runtime.lastError);
    }
  });
}
