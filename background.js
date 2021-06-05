
const excluded = new Set();

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

	const tabids = tabs.sort(function(a, b) {
		return (a.lastAccessed - b.lastAccessed)
	}).reverse().slice(MAX_ACTIV_TABS).map( t => t.id)

	tabids.forEach( async function(id) {
		if( ! excluded.has(id) ) {
			browser.tabs.discard(id)
		}
	});

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
