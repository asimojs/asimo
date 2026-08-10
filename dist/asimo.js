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
		provide: t.provide,
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
	let l = i.extends ? Object.freeze([...i.extends]) : null, u = i.services ?? [], d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new WeakMap();
	for (let n of u) if (e in n) {
		let e = n;
		for (let t of e.provide) d.set(t.ns, {
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
	let h = `${l?.[0]?.path || ""}/${i.name}`, g = {
		name: i.name,
		path: h,
		parents: l,
		*entries() {
			for (let [e, t] of d) t.notFound || (yield {
				ns: e,
				path: g.path,
				status: t.instance ? "loaded" : t.bundle ? "pending" : "registered"
			});
		},
		has(e) {
			return this.inspect(e) !== null;
		},
		inspect(e) {
			return e ? x(e) : S();
		},
		dump() {
			let e = S(), t = [`Asimo IoC Container: ${g.path}`];
			for (let n of e) t.push(`  ${n.path}: ${n.ns} - ${n.status}`);
			return t.join("\n");
		},
		dispose(e) {
			let t = d.get(e.ns);
			t && (t.instance = void 0);
		},
		get(...e) {
			return e.length === 1 ? _(e[0]) : e.map((e) => _(e));
		},
		getOptional(...e) {
			return e.length === 1 ? E(e[0]) : e.map((e) => E(e));
		},
		async fetch(...e) {
			return e.length === 1 ? _(e[0]) : Promise.all(e.map((e) => _(e)));
		},
		async fetchOptional(...e) {
			return e.length === 1 ? D(e[0]) : Promise.all(e.map((e) => D(e)));
		}
	};
	return c.set(g, d), g;
	function _(e) {
		let t = d.get(e.ns);
		if (!t) {
			let t = O(e);
			if (t !== null) return d.set(e.ns, { instance: t }), t;
			C(`Service not found: ${e.ns}`);
		}
		if (t.notFound && C(`Service not found: ${e.ns}`), t.instance) return t.instance;
		if (t.bundle && !t.factory) return T(t, e);
		if (t.factory) return t.factory.provide.every((e) => e.sync) ? v(t) : y(t);
		C("Corrupt service entry in serviceMap: no factory or bundle");
	}
	function v(e) {
		if (e.instance) return e.instance;
		let t = e.factory, n = t.load(g);
		for (let e of t.provide) {
			let t = d.get(e.ns);
			t && (t.instance = n, o?.(e, g));
		}
		return n;
	}
	async function y(e) {
		if (e.instance) return e.instance;
		let t = e.factory, n = m.get(t);
		if (n) return n;
		let r = b(t, e.maxRetries ?? a.maxRetries ?? 2, e.retryDelayMs ?? a.retryDelayMs ?? 1e3);
		m.set(t, r);
		try {
			let e = await r;
			for (let n of t.provide) {
				let t = d.get(n.ns);
				t && (t.instance = e, o?.(n, g));
			}
			return m.delete(t), e;
		} catch (e) {
			m.delete(t);
			for (let e of t.provide) {
				let t = d.get(e.ns);
				t && (t.instance = void 0);
			}
			throw e;
		}
	}
	async function b(e, t, i) {
		let a;
		for (let r = 0; r <= t; r++) try {
			return await e.load(g);
		} catch (e) {
			if (e instanceof n) throw e;
			a = e, r < t && await new Promise((e) => setTimeout(e, i * 2 ** r));
		}
		let o = new r(`Load failed for "${e.provide.map((e) => e.ns).join(", ")}" after ${t + 1} attempts`, g.path, a);
		throw s?.(o, g), o;
	}
	function x(e) {
		let t = d.get(e.ns);
		if (t && !t.notFound) return {
			ns: e.ns,
			path: g.path,
			status: t.instance ? "loaded" : t.bundle ? "pending" : "registered"
		};
		if (l) for (let t of l) {
			let n = t.inspect(e);
			if (n) return n;
		}
		return null;
	}
	function S() {
		let e = [];
		for (let [t, n] of d) n.notFound || e.push({
			ns: t,
			path: g.path,
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
	function C(e) {
		let t = new n(e, g.path);
		throw s?.(t, g), t;
	}
	async function w(e, t) {
		if (e.instance) return e.instance;
		if (e.factory) return e.factory.provide.every((e) => e.sync) ? v(e) : y(e);
		C("Corrupt service entry in serviceMap: no factory or bundle");
	}
	async function T(e, t) {
		let i = e.bundle, o = e.maxRetries ?? a.maxRetries ?? 2, l = e.retryDelayMs ?? a.retryDelayMs ?? 1e3;
		if (p.has(i)) {
			await p.get(i);
			let e = d.get(t.ns);
			return (!e || !e.factory && !e.instance) && C(`Bundle did not provide service: ${t.ns}`), w(e, t);
		}
		for (let e of i.provide) f.has(e.ns) && C(`Circular bundle loading detected for: ${e.ns}`);
		for (let e of i.provide) f.add(e.ns);
		let u = (async () => {
			let e, a = new Set(i.provide.map((e) => e.ns));
			for (let t = 0; t <= o; t++) try {
				let e = await i.load(g), t = c.get(e);
				if (t) {
					for (let [e, n] of t) if (a.has(e)) {
						let t = d.get(e);
						t && t.bundle !== i && C(`Bundle collision for "${e}": already registered by another bundle or factory`), d.set(e, n);
					}
				}
				return;
			} catch (r) {
				if (r instanceof n) throw r;
				e = r, t < o && await new Promise((e) => setTimeout(e, l * 2 ** t));
			}
			let u = new r(`Bundle load failed for "${t.ns}" after ${o + 1} attempts`, g.path, e);
			throw s?.(u, g), u;
		})();
		p.set(i, u);
		try {
			await u;
			let e = d.get(t.ns);
			return (!e || !e.factory && !e.instance) && C(`Bundle did not provide service: ${t.ns}`), w(e, t);
		} finally {
			for (let e of i.provide) f.delete(e.ns);
			p.delete(i);
		}
	}
	function E(e) {
		let t = d.get(e.ns);
		return t ? t.notFound || t.bundle && !t.instance && !t.factory ? null : t.factory ? t.factory.provide.every((e) => e.sync) ? v(t) : y(t) : v(t) : O(e);
	}
	function D(e) {
		let t = E(e);
		return t instanceof Promise ? t : Promise.resolve(t);
	}
	function O(e) {
		if (l) for (let t of l) {
			let n = t.getOptional(e);
			if (n != null) return n;
		}
		return d.set(e.ns, { notFound: !0 }), null;
	}
}
//#endregion
export { n as AsimoError, r as AsimoLoadError, a as asyncIID, s as bundle, l as createContainer, o as factory, i as syncIID };
