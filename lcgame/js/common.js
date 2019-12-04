/**
 * 基础文件，包含动画定义，公共方法（都是比较简单的）
 */
/*通过闭包自执行函数创建Common对象*/
var Common = function(){

	/*通过ID获取元素，并返回*/
	function getId(id){
		return typeof id=="string"?document.getElementById(id):id;
    }
    
	/*通过函数向Common对象下注入属性，（属性名，属性内容）*/
	function reg(space,obj){
		var namespace = exports[space] || {};
		for(var key in obj){
			namespace[key] = obj[key];
		}
		exports[space] = namespace;
    }
    
	/*定义临时对象用作闭包变量*/
	var exports = {
		getId : getId,
		reg : reg
    };
    
	return exports;
}();

/*通过前面定义好的命名空间函数，创建file方法，用于加载图片，第二个参数是个自执行闭包*/
Common.reg('file',function(){

    // 操作图片文件方法
    function imgs(urlArr,callbackFn){
        var count = 0;
        var imgs = [];
        for(var i=0;i<urlArr.length;i++){
            var img = new Image();
            img.onload = function(){
                this.onload = null;
                imgs.push(this);
                count += 1;
                img = null;
                if(count >= urlArr.length){
                    //重新排序 保证处理后的数组内容顺序和原来一样
                    imgs.sort(function(a,b){return a.index-b.index;});
                    callbackFn && callbackFn(imgs);
                }
            }
            img.index = i;
            img.src = urlArr[i];
        }
    }

	var exports = {
		imgs : imgs,
	}

	return exports;
}())


// 人物动作对象集合
Common.reg('sprite',function(){

    // 动画帧（每个动作）的定义
    /**
	 @param x int 帧 在人物在游戏图中的起始x坐标
	 @param y int 帧 在人物在游戏图中的起始y坐标
	 @param w int 帧 在人物在游戏图中的宽
	 @param h int 帧 在人物在游戏图中的高
	 @param dw int 帧 实际的宽
	 @param dh int 帧 实际的高
    */
    
    // 保存每个动作（每一帧）
    var Frame = function(x,y,w,h,dw,dh){
        this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.dw = dw;
		this.dh = dh;
    }

    //一个人物与的动画定义
	/**
	 * {startX:192,fs:2,sw:64,sh:64,width:32,height:32,loop:true}
	 @param arr Array 帧的数组
	 @param repeat boolean 动画是否重复
    */
    
    var Animation = function(param){
        /*截取图片起始坐标*/
		this.startX = param.startX || 0;
		this.startY = param.startY || 0;
		/*图片动画帧数*/
		this.fs = param.fs || 1;
		/*截取图片尺寸*/
		this.sw = param.sw || 0;
		this.sh = param.sh || 0;
		/*图片显示尺寸*/
		this.width = param.width || param.sw;
		this.height = param.height || param.sh;
		/*截取图片方向*/
		this.dir = param.dir || "right";
		/*是否循环播放，通过!!强制转换boolean类型*/
		this.loop = !!param.loop;
		//存放帧图像的集合
		this.ls = [];
		//当前帧，用于存放数据对象
		this.current = null;
		//当前帧得索引
		this.index = -1;
		/*调用初始化*/
		this.init();
    }

    Animation.prototype = {
		//初始化帧动画(人物)---人物的每个动作为1帧
        init : function(){
			/*通过循环创建动画的每个帧*/
			for(var i=0;i<this.fs;i++){
				/*计算截取坐标，通过this.dir判断截取方向*/
				var x = this.startX + (this.dir=="right"?i*this.sw:0);
				var y = this.startY + (this.dir=="down"?i*this.sh:0);
				/*定义一个帧实例*/
				var frame = new Frame(x,y,this.sw,this.sh,this.width,this.height);
				//将帧动画(人物)存入数组
				this.ls.push(frame);
			}
			/*当前索引重置*/
			this.index = 0;
			/*动画帧重置*/
			this.current = this.ls[0];
        },
        //下一帧
		next : function() {
			if(this.index + 1 >= this.ls.length){//当前帧得索引+1 >= 存放的帧数
				if(this.loop){//是否循环
					this.current = this.ls[0];//当前帧
					this.index = 0;//当前帧得索引
				}
			}
			else{//当前帧得索引+1 < 存放的帧数
				this.index += 1;//当前帧得索引++
				this.current = this.ls[this.index];//在存放的帧的集合【ls】中  获取  当前帧
			}
		},
		//重置为第一帧
		reset : function(){
			this.current = this.ls[0];//当前帧
			this.index = 0;//当前帧得索引
		},
		//人物大小
		size : function(){
			return {w:this.width,h:this.height};
		}
    }

    // 一个人物的定义动画
    /**
	 @param objParam object 动画的json对象 {"left":[frame1,frame2],"right":[frame1,frame2]}
	 @param def string 默认动画索引
	 @param img object 人物的雪碧图
	 @param cxt object canvas对象
	 @param x int 人物的起始位置x
	 @param y int 人物的起始位置y
    */
    
    var Sprite = function(img,cxt,fps,param){
        /*创建属性，用于存储所有动作动画*/
        this.animations = {};
        /*当前图片对象*/
        this.img = img;
        /*页面中的2d画布*/
        this.cxt = cxt;
        /*显示坐标*/
        this.x = param.x || 0;
        this.y = param.y || 0;
        this.fps = fps;//每秒帧数
        this.xspeed = param.xspeed || 0;//x轴加速度
        this.yspeed = param.yspeed || 0;//y轴加速度
        this.yaspeed = param.yaspeed || 0;//y轴 加速度 增量
        this.lazy = 1000 / this.fps;//延迟
        this.last = 0;//持续
        this.moveLazy = 33;//延迟移动
        this.moveLast = 0;//持续移动
        this.index = null;//当前动画
        this.key = "";//当前按键
    }

    Sprite.prototype = {
        //添加相应按键动画，(动作名，动画参数)
		add : function(key,animation){
			/*参数动作参数保存*/
			this.animations[key] = animation;
			if(!this.index){
				this.index = animation;
				this.key = key;
			}
        },
        //修改当前动画动作组（动画对应按键）
		change : function(key){
			/*如果参数与当前动画一致则直接返回什么也不做*/
			if(key == this.key)return false;
			/*临时索引赋值当前帧数据*/
			var index = this.animations[key];
			/*避免空值*/
			if(!index)return false;
			this.index = index;
			this.okey = this.key;//上一次的按键
			this.key = key;
			this.index.reset();//重置动画
        },
        //绘画出当前帧
		draw : function(){
			if(!this.index || !this.img)return false;
			var frame = this.index.current;
			this.cxt.drawImage(this.img,frame.x,frame.y,frame.w,frame.h,this.x,this.y,frame.dw,frame.dh);
        },
        //更新动画，改变当前帧参数
		update : function(){
			//当前时间
			//返回指定的 Date 对象自 1970 年 1 月 1 日午夜（通用时间）以来的毫秒数
			var t = new Date().getTime();
			//时间差值 = 当前时间 - 持续时间(启动时间)
			var diff = t - this.last;
			//移动时间差值  = 当前时间 - 移动时间差值
			var moveDiff = t - this.moveLast;
			if(this.last == 0){//持续时间(启动时间)
				diff = this.lazy;//延迟时间
				moveDiff = this.moveLazy;//移动延迟时间
			}
			if(diff >= this.lazy){// 时间差值 >= 延迟时间	
				this.index.next();//当前动画 下一帧
				this.last = t;//持续时间(启动时间)
			}
			/*更新参数*/
			if(moveDiff >= this.moveLazy){//移动时间差值 >= 移动延迟时间
				//y轴 增量 非空	
				if(this.yaspeed)this.yspeed += this.yaspeed;//y轴加速度 + y轴 增量
				//x轴加速度 非空
				if(this.xspeed)this.x += this.xspeed;//增加  x轴加速度 
				//y轴加速度 非空
				if(this.yspeed)this.y += this.yspeed;//增加 y轴加速度
				this.moveLast = t;//移动延迟时间(启动时间)
            }
        },
        //设置X轴加速度
        setXSpeed : function(xs){
            this.xspeed = xs;
        },
        //设置Y轴加速度
        setYSpeed : function(ys,yas){
            this.yspeed = ys;
            this.yaspeed = yas || 0;
        },
        //获取当前人物大小
        size : function(){
            /*获取当前帧*/
            var frame = this.index.current;
            return {w:frame.dw,h:frame.dh,x:this.x,y:this.y,r:this.x+frame.dw,b:this.y+frame.dh};
        },
        //移动
        move : function(x,y){
            this.x = x;
            this.y = y;
        }
	}
	
	//返回人物当前帧 的动画
	var exports = {
		Frame : Frame,
		Animation : Animation,
		Sprite : Sprite
	};

	return exports;

}())


// 定时器方法
Common.reg('time',function(){
	//定义贞管理类，兼容
	/*使用JS自带帧管理器，requestAnimationFrame作为定时器*/

	// window.requestAnimationFrame() 
	// 告诉浏览器——你希望执行一个动画，
	// 并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。
	// 该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行

	var requestAnimationFrame = window.requestAnimationFrame
								|| window.mozRequestAnimationFrame
								|| window.webkitRequestAnimationFrame
								|| function(callbackFn){setTimeout(callbackFn,1000/60)};

	var TimeProcess = function(){
		/*创建数组用于保存参与动画的对象*/
		this.list = [];
		this.isStart = false;
	}

	TimeProcess.prototype = {
		/*添加对象到定时器中，（方法，参数，对象）*/
		add : function(callbackFn,param,context){
			this.list.push({callbackFn:callbackFn,param:param,context:context});
		},
		start : function(){
			this.isStart = true;
			var self = this;
			requestAnimationFrame(function(){
				var item = null,
					p = [];
				for(var i=0;i<self.list.length;i++){
					item = self.list[i];
					item.callbackFn.apply(item.context,item.param);
				}
				if(self.isStart)requestAnimationFrame(arguments.callee);
			});
		},
		stop : function(){
			this.isStart = false;
		}
	}

	var exports = {
		TimeProcess : TimeProcess
	};
	return exports;
}())