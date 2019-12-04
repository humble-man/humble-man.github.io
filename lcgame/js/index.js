/**
 * 游戏主逻辑入口文件，处理主要逻辑
 */
var Main = {
	gameInfo : {w:0,h:0},//游戏画面大小
	cxt : null,//context  绘制图形的上下文对象
	person : null,
	timeQuene : null,//时间队列，定时器
	time : 0,
	leveltime : 0,//等级时间
	level : 0,//等级
	imgs : [],//图片
	blocks : [],//障碍物,
	cs : 0,
	//初始化
	init : function(){
		Main.initStart();
	},
	//初始化开始
	initStart : function(){
		Main.initData();
	},
	//初始化数据
	initData : function(){
		Common.file.imgs(["img/man.png","img/block.png","img/move.png","img/thorn.png","img/flip.png","img/thorn_bg.png"],function(imgs){
			Main.imgs = imgs;
			var canvas = Common.getId("canvas");
			canvas.width = screen.availWidth;
			canvas.height = screen.availHeight;
			Main.gameInfo.w = canvas.offsetWidth;// 偏移宽度
			Main.gameInfo.h = canvas.offsetHeight;// 偏移高度
			Main.cxt = canvas.getContext("2d");//可以在页面绘制图形的对象
			Common.getId("startLoading").style.display="none";
			Common.getId("startBtn").style.display = "block";
			Common.getId("leftBtn").style.display = "block";
			Common.getId("rightBtn").style.display = "block";
		});
	},
	//开始
	start : function(){
		Common.getId("startFn").style.display = "none";
		Common.getId("startTip").style.display = "none";
		//初始化人物
		Main.person = new Person(screen.availWidth / 4,0,Main.imgs[0],Main.cxt,Main.gameInfo);
		//初始化障碍物
		Main.initBlock(Main.imgs);
		//初始化事件
		Main.initEvent();
		//启动游戏，运行
		Main.process();

	},
	initBlock : function(imgs){//初始化障碍物
		BlockFactory.init({
			block : imgs[1],
			move : imgs[2],
			flip : imgs[4],
			thorn : imgs[3],
			cxt : Main.cxt,
			gameinfo : Main.gameInfo
		});
		var block = new NormalBlock(120,screen.availHeight,imgs[1],Main.cxt,Main.gameInfo);
		block.init();
		Main.blocks.push(block);
	},
	//游戏运行
	process : function(){
		var tq = new Common.time.TimeProcess();
		tq.add(Main.draw,null,Main);
		tq.add(Main.update,null,Main);
		//游戏时间进程
		this.timeQuene = tq;
		this.timeQuene.start();
	},
	draw : function(){
		Main.cxt.clearRect(0,0,Main.gameInfo.w,Main.gameInfo.h);//清除图像
		Main.drawThornBg();//绘制荆棘（针刺）背景
		Main.person.draw();//绘制人物

		//绘制障碍物
		for(var i=0,l=Main.blocks.length;i<l;i++){
			if(!Main.blocks[i])continue;
			Main.blocks[i].draw();
		}

		//设置血量为小人的生命值
		var fontsize = window.innerWidth / 18.75;
		Common.getId("personLife").style.width = Main.person.life / fontsize >= 5?'5rem':(Main.person.life / fontsize) + "rem";
		//设置楼层
		Common.getId("levelNum").innerHTML = Main.level;
	},
	drawThornBg : function(){//绘制荆棘（针刺）背景
		var ratio = window.innerWidth / 375;
		var zcNum = screen.availWidth / (15 * ratio);
		for(var i=0;i<=parseInt(zcNum) + 1;i++){
			Main.cxt.drawImage(Main.imgs[5],0,0,18,21,i*20,0, (15 * ratio), (15 * ratio));
		}
	},
	update : function(){//更新
		//时间累加
		Main.time++;
		//更新级别
		if(Main.time >= 40){
			Main.blocks.push(BlockFactory.create());
			Main.time = 0;//时间
			Main.leveltime += 10;//级别时间
			Main.level = Math.floor(Main.leveltime / 10);//级别
		}
		//小人更新
		Main.person.update();
		if(Main.person.isDead){

			Main.over();//游戏结束

			Common.getId("personLife").style.width = "0rem";
			Common.getId("leftBtn").style.display = "none";
			Common.getId("rightBtn").style.display = "none";

			return false;
		}
		//障碍物更新
		for(var i=0,l=Main.blocks.length;i<l;i++){
			var block = Main.blocks[i];
			if(!block)continue;
			block.update();
			//检查障碍物是否超出地图 或者  障碍物销毁
			if(block.checkMap() || block.dismiss){
				//删除障碍物
				Main.removeBlock(block);
				i--;
				//障碍物销毁 同时 小人站在的障碍物不为空  
				if(block.dismiss && Main.person.block)Main.person.goDown();
				//障碍物为空
				block = null;
				continue;
			}
			//检查小人 是否在障碍物上
			if(Main.person.checkBlockOn(block)){}
		}
	},
	initEvent : function(){
		document.onkeydown = function(e){Main.keyDown(e);};
		document.onkeyup = function(e){Main.keyUp(e);};
		
	},
	click(str){
		var str = str;
		if(str=='left'){
			this.person.changeDir("left");
		}else if(str=='right'){
			this.person.changeDir("right");
		}
	},
	clickOver(){
		this.person.changeDir("normal");
	},
	//按键按下
	keyDown : function(e){
		if(e.keyCode == 32){
			　Main.cs++;
			if(Main.cs%2!=0){
			  Main.stop();
			}
			else{
				Main.continueGame();
			}
		}
		if(e.keyCode == 37){	
			this.person.changeDir("left");
		}
		if(e.keyCode == 39){
			this.person.changeDir("right");
		}
		e.preventDefault();
	},
	//按键松开
	keyUp : function(e){
		if(e.keyCode == 37 || e.keyCode == 39){
			this.person.changeDir("normal");
		}
		e.preventDefault();
	},
	// 游戏结束
	over : function(){
		//游戏时间进程停止
		this.timeQuene.stop();
		//显示游戏结束提示
		Common.getId("endFn").style.display = "block";
		if(this.level >= 100){
			Common.getId("endFn").getElementsByTagName("p")[0].innerHTML = "666,玩了<label>"+this.level+"</label>分,太厉害了！";
			Common.getId("endFn").getElementsByTagName("a")[0].innerHTML = "超越自己，再来一次";
			Common.getId("endFn").getElementsByTagName("span")[0].className = "icon happy";
		}
		else{
			Common.getId("endFn").getElementsByTagName("p")[0].innerHTML = "你太菜了,才玩了<label>"+this.level+"</label>分,再练练吧！";
			Common.getId("endFn").getElementsByTagName("a")[0].innerHTML = "再来一次";
			Common.getId("endFn").getElementsByTagName("span")[0].className = "icon";
		}

	},
	// 移除障碍物
	removeBlock : function(block){
		Main.blocks.splice(Main.blocks.indexOf(block),1);
	},
	replay : function(){
		Main.blocks = [];
		Main.time = 0;
		Main.leveltime = 0;
		Main.level = 0;
		Main.person.life = 100;
		Main.start();
		Common.getId("endFn").style.display = "none";
		Common.getId("leftBtn").style.display = "block";
		Common.getId("rightBtn").style.display = "block";
	},
	stop : function(){
		this.timeQuene.stop();
		 document.querySelector("#gameTip").style.opacity="1";
	 },
	 continueGame : function(){
		// this.timeQuene.start();
		Main.process();
		document.querySelector("#ztl").style.opacity="0";
	}
}
Main.init();

