
const excluded = new Set();

function difference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}

async function onActivated(activeInfo) {

	let tabs = await browser.tabs.query({url: "*://*/*", pinned: false});

	const MAX_ACTIV_TABS = (await (async () => {
		try {
			const storeid = 'maxactivtabs';
			let tmp = await browser.storage.local.get(storeid);
			if (typeof tmp[storeid] !== 'undefined'){
				tmp = parseInt(tmp[storeid]);
			}
			if(typeof tmp === 'number') {
				if(tmp > 0) {
					return tmp;
				}
			}
		}catch(e){
			console.error(e);
		}
		return 3;

	})());

	let tabids = tabs.sort(function(a, b) {
		return (a.lastAccessed - b.lastAccessed)
	}).reverse().map( t => t.id);

	//console.log('discarded with excluded', tabids);

	// keep the order, but remove the excluded once 
	excluded.forEach(function(value) {
		const idx = tabids.indexOf(value)
		if(idx > -1){
			tabids.splice(idx,1);
		}
	});
	//console.log('discarded without excluded', tabids);
	tabids = tabids.slice(MAX_ACTIV_TABS);
	//console.log('discarded without excluded and sliced down', tabids);

	browser.tabs.discard(tabids);

}

async function onClicked(tab, clickData){
	if( excluded.has(tab.id) ){
		excluded.delete(tab.id);
		await browser.browserAction.setBadgeText({tabId: tab.id, text: "" }); // managed
	}else{
		excluded.add(tab.id);
		await browser.browserAction.setBadgeText({tabId: tab.id, text: "off" }); // managed
	}
}

function onRemoved(tabId, removeInfo) {
    excluded.delete(tabId);
}


// add listeners
browser.tabs.onActivated.addListener(onActivated);
browser.browserAction.onClicked.addListener(onClicked);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onUpdated.addListener( async (tabId, changeInfo, tabInfo) => {
	if(changeInfo.status !== 'complete'){
		return;
	}
	if (excluded.has(tabId)) {
		await browser.browserAction.setBadgeText({"tabId": tabId, text: "off" }); // managed
	}
}, {properties:['status']} );

// todo: add context menu on tab 
// todo: add icon to tab 
