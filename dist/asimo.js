//#region src/asimo.types.ts
var e = Symbol("asimo.serviceFactory"), t = Symbol("asimo.serviceBundle"), n = class extends Error {
	container;
	messagePrefix;
	constructor(e, t) {
		super(`[Asimo] ${e} at ${t}`), this.container = t, this.name = "AsimoError", this.messagePrefix = "[Asimo] ";
	}
}, r = class extends n {
	cause;
	constructor(e, t, n) {
		super(e, t), this.name = "AsimoLoadError", this.cause = n;
	}
};
function i() {
	return function(e) {
		return {
			ns: e,
			sync: !0
		};
	};
}
function a() {
	return function(e) {
		return {
			ns: e,
			sync: !1
		};
	};
}
function o(t) {
	return {
		[e]: !0,
		interface: t.provide,
		dependencies: t.dependencies,
		load: t.load,
		maxRetries: t.maxRetries,
		retryDelayMs: t.retryDelayMs
	};
}
function s(e) {
	return {
		[t]: !0,
		provide: e.provide,
		dependencies: e.dependencies,
		load: e.load,
		maxRetries: e.maxRetries,
		retryDelayMs: e.retryDelayMs
	};
}
var c = /* @__PURE__ */ new WeakMap();
function l(i) {
	let a = i.config ?? {}, o = a.onLoad, s = a.onError;
	if (i.name.includes("/")) throw Error(`[Asimo] Container name must not contain forward slashes: "${i.name}"`);
	if (i.services !== void 0 && !Array.isArray(i.services)) throw Error("[Asimo] services must be an array");
	let l = i.extends ? Object.freeze([...i.extends]) : null, u = i.services ?? [], d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Map();
	for (let n of u) if (e in n) {
		let e = n;
		d.set(e.interface.ns, {
			factory: e,
			maxRetries: e.maxRetries,
			retryDelayMs: e.retryDelayMs
		});
	} else if (t in n) {
		let e = n;
		for (let t of e.provide) d.set(t.ns, {
			bundle: e,
			maxRetries: e.maxRetries,
			retryDelayMs: e.retryDelayMs
		});
	}
	let m = `${l?.[0]?.path || ""}/${i.name}`, h = {
		name: i.name,
		path: m,
		parents: l,
		*entries() {
			for (let [e, t] of d) t.notFound || (yield {
				ns: e,
				path: h.path,
				status: t.instance ? "loaded" : t.bundle ? "pending" : "registered"
			});
		},
		has(e) {
			return this.inspect(e) !== null;
		},
		inspect(e) {
			return e ? b(e) : x();
		},
		dump() {
			let e = x(), t = [`Asimo IoC Container: ${h.path}`];
			for (let n of e) t.push(`  ${n.path}: ${n.ns} - ${n.status}`);
			return t.join("\n");
		},
		dispose(e) {
			let t = d.get(e.ns);
			t && (t.instance = void 0);
		},
		get(...e) {
			return e.length === 1 ? g(e[0]) : e.map((e) => g(e));
		},
		getOptional(...e) {
			return e.length === 1 ? T(e[0]) : e.map((e) => T(e));
		},
		async fetch(...e) {
			return e.length === 1 ? g(e[0]) : Promise.all(e.map((e) => g(e)));
		},
		async fetchOptional(...e) {
			return e.length === 1 ? E(e[0]) : Promise.all(e.map((e) => E(e)));
		}
	};
	return c.set(h, d), h;
	function g(e) {
		let t = d.get(e.ns);
		if (!t) {
			let t = D(e);
			if (t !== null) return d.set(e.ns, { instance: t }), t;
			S(`Service not found: ${e.ns}`);
		}
		if (t.notFound && S(`Service not found: ${e.ns}`), t.instance) return t.instance;
		if (t.bundle && !t.factory) return w(t, e);
		if (t.factory) return t.factory.interface.sync ? _(t) : v(t);
		S("Corrupt service entry in serviceMap: no factory or bundle");
	}
	function _(e) {
		if (e.instance) return e.instance;
		if (e.factory) return e.instance = e.factory.load(h), o?.(e.factory.interface, h), e.instance;
		S("Corrupt service entry in serviceMap: no factory or bundle");
	}
	async function v(e) {
		let t = y(e, e.maxRetries ?? a.maxRetries ?? 2, e.retryDelayMs ?? a.retryDelayMs ?? 1e3);
		e.instance = t;
		try {
			let n = await t;
			return e.instance = n, o?.(e.factory.interface, h), n;
		} catch (t) {
			throw e.instance = void 0, t;
		}
	}
	async function y(e, t, i) {
		let a;
		for (let r = 0; r <= t; r++) try {
			return await e.factory.load(h);
		} catch (e) {
			if (e instanceof n) throw e;
			a = e, r < t && await new Promise((e) => setTimeout(e, i * 2 ** r));
		}
		let o = new r(`Load failed for "${e.factory.interface.ns}" after ${t + 1} attempts`, h.path, a);
		throw s?.(o, h), o;
	}
	function b(e) {
		let t = d.get(e.ns);
		if (t && !t.notFound) return {
			ns: e.ns,
			path: h.path,
			status: t.instance ? "loaded" : t.bundle ? "pending" : "registered"
		};
		if (l) for (let t of l) {
			let n = t.inspect(e);
			if (n) return n;
		}
		return null;
	}
	function x() {
		let e = [];
		for (let [t, n] of d) n.notFound || e.push({
			ns: t,
			path: h.path,
			status: n.instance ? "loaded" : n.bundle ? "pending" : "registered"
		});
		if (l) {
			let t = new Set(d.keys());
			for (let n of l) {
				let r = n.inspect();
				for (let n of r) t.has(n.ns) || (e.push(n), t.add(n.ns));
			}
		}
		return e;
	}
	function S(e) {
		let t = new n(e, h.path);
		throw s?.(t, h), t;
	}
	async function C(e) {
		if (e.instance) return e.instance;
		if (e.factory) return e.factory.interface.sync ? _(e) : v(e);
		S("Corrupt service entry in serviceMap: no factory or bundle");
	}
	async function w(e, t) {
		let i = e.bundle, o = e.maxRetries ?? a.maxRetries ?? 2, l = e.retryDelayMs ?? a.retryDelayMs ?? 1e3;
		if (p.has(i)) {
			await p.get(i);
			let e = d.get(t.ns);
			return (!e || !e.factory && !e.instance) && S(`Bundle did not provide service: ${t.ns}`), C(e);
		}
		for (let e of i.provide) f.has(e.ns) && S(`Circular bundle loading detected for: ${e.ns}`);
		for (let e of i.provide) f.add(e.ns);
		let u = (async () => {
			let e, a = new Set(i.provide.map((e) => e.ns));
			for (let t = 0; t <= o; t++) try {
				let e = await i.load(h), t = c.get(e);
				if (t) {
					for (let [e, n] of t) if (a.has(e)) {
						let t = d.get(e);
						t && t.bundle !== i && S(`Bundle collision for "${e}": already registered by another bundle or factory`), d.set(e, n);
					}
				}
				return;
			} catch (r) {
				if (r instanceof n) throw r;
				e = r, t < o && await new Promise((e) => setTimeout(e, l * 2 ** t));
			}
			let u = new r(`Bundle load failed for "${t.ns}" after ${o + 1} attempts`, h.path, e);
			throw s?.(u, h), u;
		})();
		p.set(i, u);
		try {
			await u;
			let e = d.get(t.ns);
			return (!e || !e.factory && !e.instance) && S(`Bundle did not provide service: ${t.ns}`), C(e);
		} finally {
			for (let e of i.provide) f.delete(e.ns);
			p.delete(i);
		}
	}
	function T(e) {
		let t = d.get(e.ns);
		return t ? t.notFound || t.bundle && !t.instance && !t.factory ? null : t.factory && !t.factory.interface.sync ? C(t) : _(t) : D(e);
	}
	function E(e) {
		let t = T(e);
		return t instanceof Promise ? t : Promise.resolve(t);
	}
	function D(e) {
		if (l) for (let t of l) {
			let n = t.getOptional(e);
			if (n != null) return n;
		}
		return d.set(e.ns, { notFound: !0 }), null;
	}
}
//#endregion
export { n as AsimoError, r as AsimoLoadError, a as asyncIID, s as bundle, l as createContainer, o as factory, i as syncIID };
