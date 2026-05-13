const cache = new Set();
const a = {};
a.b = a;
try {
	JSON.stringify(a, (k, v) => {
	  if (typeof v === 'object' && v !== null) {
		if (cache.has(v)) {
		  return;
		}
		cache.add(v);
	  }
	  return v;
	});
	console.log("Success");
} catch(e) {
	console.log("Error", e);
}
