(function(w,d,ff){
	var RawType = ff.RawType;
	var each = ff.each;
	var mock = ff.mock;
	var observe = ff.observe;
	var query = ff.query;
	var convert = ff.convert;
	var Association = ff.Association;
	var Syntax = function(tokenStr){
		var tokens = tokenStr.split(Syntax.token);
		each(tokens,function(i){
			var ass = Syntax.ass.exec(this)[1];
			tokens[i] = new Association(ass);
		},function(){return Syntax.ass.test(this);});
		this.tokens = tokens;
	};
	Syntax.prototype.exec = function(global,local){
		var buffer = [];
		each(this.tokens,function(){
			if(RawType.Association.has(this)){
				if(this.exists(local)){
					buffer.push(this.valueOf(local));
				}else{
					buffer.push(this.valueOf(global));
				}
			}else{
				buffer.push(this);
			}
		});
		return buffer.join("");
	};
	Syntax.token = /(\{{2}[a-zA-Z0-9_\.\[\]]{1,}\}{2})/g;
	Syntax.ass = (function(ass){
		ass.test = ass.test.after(function(jp){
			this.restore();
		});
		ass.exec = ass.exec.after(function(jp){
			this.restore();
		});
		return ass;
	})(/^\{{2}([a-zA-Z0-9_\.\[\]]{1,})\}{2}$/g);
	var ListView = function(dom,hooks,localDef){
		this.dom = dom;
		each(localDef,function(){
			var ass = Syntax.ass.exec(this.value)[1];
			localDef[this.key] = new Association(ass);
		},function(){return Syntax.ass.test(this.value);});
		this.localDef = localDef;
		this.listAssn = new Association(hooks.list);
		each(hooks,function(){
			hooks[this.key] = new Syntax(this.value);
		},function(){return !RawType.Function.has(this.value);});
		this.hooks = hooks;
		this.items = view.convert(query.getChild(dom,true));
	};
	ListView.prototype.exec = function(context,render){
		var local = {};
		each(this.localDef,function(){
			if(RawType.Association.has(this.value)){
				local[this.key] = this.value.valueOf(context.global);
			}else{
				local[this.key] = this.value;
			}
		});
		local = ff.extend(context.local,local);
		if(this.listAssn.exists(local)){
			local.list = this.listAssn.valueOf(local);
		}else{
			local.list = this.listAssn.valueOf(context.global);
		}
		var self = this;
		each(local.list,function(){
			var clone = query.cloneNode(self.dom);
			local.item = this;
			each(self.items,function(){
				this.exec({global:context.global,local:local},clone);
			});
			query.append(render,clone);
		});
	};
	var TagView = function(dom,hooks,localDef){
		this.dom = dom;
		each(localDef,function(){
			var ass = Syntax.ass.exec(this.value)[1];
			tokens[this.key] = new Association(ass);
		},function(){return Syntax.ass.test(this.value);});
		this.localDef = localDef;
		each(hooks,function(){
			hooks[this.key] = new Syntax(this.value);
		},function(){return !RawType.Function.has(this.value);});
		this.hooks = hooks;
		this.items = view.convert(query.getChild(dom,true));
	};
	TagView.prototype.exec = function(context,render){
		var clone = query.cloneNode(this.dom);
		var local = {};
		each(this.localDef,function(){
			if(RawType.Association.has(this.value)){
				local[this.key] = this.value.valueOf(context.global);
			}else{
				local[this.key] = this.value;
			}
		});
		local = ff.extend(context.local,local);
		each(this.hooks,function(){
			query.setAttr(clone,this.key,this.value.exec(context.global,local));
		},function(){return !RawType.Function.has(this.value);});
		query.append(render,clone);
		each(this.items,function(){
			this.exec({global:context.global,local:local},clone);
		});
	};
	var TextView = function(dom){
		this.dom = dom;
		this.syntax = new Syntax(dom.nodeValue);
	};
	TextView.prototype.exec = function(context,render){
		var clone = query.cloneNode(this.dom);
		clone.nodeValue = this.syntax.exec(context.global,context.local);
		query.append(render,clone);
	};
	var View = function(tpl){
		this.items = view.convert(query.parseHTML(tpl));
		ff.view.store[tpl.hashCode()] = this;
	};
	View.prototype.exec = function(data,render){
		each(this.items,function(){
			this.exec({global:data,local:{}},render);
		});
	};
	var view = ff.view = function(config){
		var cfg = ff.extend({
				view : "script[type='text/flyfire-view']",
				data : {},
				render : "body"
		},config);
		var view = query(cfg.view);
		var render = query(cfg.render);
		view.each(function(){
			var tpl = query.getText(this);
			var vw = ff.view.store[tpl.hashCode()]||new View(tpl);
			render.each(function(){
				vw.exec(cfg.data,this);
			});
		});
	};
	ff.view.store = {};
	ff.view.extraHooks = ["id","class","name","value","style","title","type","href","rel","src","readonly","checked","list","filter"];
	ff.view.convert = function(doms){
		var items = [];
		each(doms,function(){
			var dom = this;
			var hooks = {};
			if(this.nodeType===1){
				each(view.extraHooks,function(){
					var ass = query.getAttr(dom,this);
					if(Syntax.ass.test(ass)){
						hooks[this] = ass;	
					}
				});
				var localDef = convert(query.getAttr(dom,"def"));
				if(!RawType.Object.has(localDef)){
					localDef = {};
				}
				if(hooks.list){
					query.removeAttr(dom,"list");
					items.push(new ListView(dom,hooks,localDef));
				}else{
					items.push(new TagView(dom,hooks,localDef));
				}
			}else if(this.nodeType===3){
				items.push(new TextView(dom));
			}
		});
		return items;
	};
})(window,document,flyfire);