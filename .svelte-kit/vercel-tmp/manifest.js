export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.Cv862UrR.js",app:"_app/immutable/entry/app.UbCoeLMN.js",imports:["_app/immutable/entry/start.Cv862UrR.js","_app/immutable/chunks/B_EtmAjJ.js","_app/immutable/chunks/ClOfLx3j.js","_app/immutable/chunks/Dz_rfxTK.js","_app/immutable/chunks/DhUVGaAf.js","_app/immutable/entry/app.UbCoeLMN.js","_app/immutable/chunks/ClOfLx3j.js","_app/immutable/chunks/CNs9amC5.js","_app/immutable/chunks/CaaXtaQm.js","_app/immutable/chunks/DhUVGaAf.js","_app/immutable/chunks/BT6qVgAc.js","_app/immutable/chunks/CfuIVgKi.js","_app/immutable/chunks/Dz_rfxTK.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/surah/[id]",
				pattern: /^\/surah\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/vocabulary",
				pattern: /^\/vocabulary\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
