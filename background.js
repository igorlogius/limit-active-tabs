
async function onActivated(activeInfo) {

	let tabs = await browser.tabs.query({url: "*://*/*"});

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

	//console.log(MAX_ACTIV_TABS);

	const tabids = tabs.sort(function(a, b) {
		return (a.lastAccessed - b.lastAccessed)
	}).reverse().slice(MAX_ACTIV_TABS).map( t => t.id)

	console.log('discarded tabs', tabids);
	browser.tabs.discard(tabids);


}
browser.tabs.onActivated.addListener(onActivated);

