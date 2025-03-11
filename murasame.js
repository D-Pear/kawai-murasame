(function () {

    // 参数设置
    const imgSrc = './assets/murasame.png';   // 理论上也可以换成其他角色就是了
    const cssAnimtaion = true;                // 启用额外动画(如果卡顿则关闭)
    const imgScale = 0.5;                     // 图像缩放
    const maxSpeed = 720;                     // 最大移动速度(正常)
    const acceleration = 12;                  // 加速度(正常)
    const idleMaxSpeed = 240;                 // 最大移动速度(闲置)
    const idleAcceleration = 4;               // 加速度(闲置)
    const minRandomMoveRatio = 0.4;           // 随机移动最小距离(闲置)
    const maxRandomMoveAttempts = 25;         // 随机移动最大重试次数(闲置)
    const idleTimeout = 5000;                 // 闲置超时时间
    const bobEffectStergen = 1.5;             // 浮动特效强度
    const bobEffectDuration = 150;            // 浮动特效周期
    const minDistance = 100;                  // 鼠标近进距离
    const friction = 0.088;                   // 摩擦系数(全局)
    const closeFriction = 0.12;               // 摩擦系数(近进)
    const maxAngle = 90;                      // 最大旋转角
    const angleRectification = 15;            // 旋转角矫正
    const heartDuration = 1500;               // 爱心出现间隔时间
    const heartScale = 0.6;                   // 爱心大小缩放
    const heartRandomDistance = 40;           // 爱心随机距离
    const heartOpacity = 0.7;                 // 爱心基础透明度
    const screenCornerSaveDistance = 75;      // 屏幕边缘安全区

    // 容器
    const character = document.createElement('img');
    character.style.position = 'fixed';
    character.style.width = '150px';
    character.style.height = '150px';
    character.style.left = '0px';
    character.style.top = '0px';
    character.style.cursor = "grab"
    character.style.zIndex = '9998';
    character.style.userSelect = "none";
    character.style.transition = cssAnimtaion ? "all 0.1s" : null;
    character.src = imgSrc;
    appendWithFade(character, document.body);

    // 爱心
    const heartsContainer = document.createElement('div');
    heartsContainer.style.position = 'fixed';
    heartsContainer.style.pointerEvents = 'none';
    heartsContainer.style.zIndex = '9998';
    heartsContainer.style.width = '100%';
    heartsContainer.style.height = '100%';
    heartsContainer.style.top = '0';
    heartsContainer.style.left = '0';
    document.body.appendChild(heartsContainer);

    // 运动
    let lastUpdateTime = Date.now();
    let currentX = Math.random() * window.innerWidth;
    let currentY = Math.random() * window.innerHeight;
    let targetX = currentX;
    let targetY = currentY;
    let velocityX = 0;
    let velocityY = 0;

    // 拖拽
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let isFrezeeMode = false;

    // 随机移动
    let lastMouseMoveTime = 0;
    let isIdle = true;
    let randomMoveTargetX = currentX;
    let radomMoveTargetY = currentY;
    let lastRandomMoveTime = 0;
    let randomMoveAngle = 0;
    let animationFrameId = null;
    let isPageVisible = true;

    updatePosition();

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) {
            targetX = e.clientX;
            targetY = e.clientY;
            lastMouseMoveTime = Date.now();
            isIdle = false;
        }
    });

    character.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);

    character.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止滚动
        const touch = e.touches[0];
        startDrag({ clientX: touch.clientX, clientY: touch.clientY });
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault(); // 防止滚动
            const touch = e.touches[0];
            onDrag({ clientX: touch.clientX, clientY: touch.clientY });
        }else {
            targetX = touch.clientX;
            targetY = touch.clientY;
            lastMouseMoveTime = Date.now();
            isIdle = false;
        }
    });

    document.addEventListener('touchend', endDrag);

    // 冻结模式
    character.addEventListener("dblclick", () => {
        isFrezeeMode = !isFrezeeMode;
        if (isFrezeeMode) createHeartEffect();
    });

    window.addEventListener('resize', () => {
        currentX = Math.min(Math.max(screenCornerSaveDistance, currentX), window.innerWidth - screenCornerSaveDistance);
        currentY = Math.min(Math.max(screenCornerSaveDistance, currentY), window.innerHeight - screenCornerSaveDistance);
        updatePosition();
    });

    // 防跳
    document.addEventListener('visibilitychange', () => {
        isPageVisible = document.visibilityState === 'visible';
        if (isPageVisible && !animationFrameId) {
            animationFrameId = requestAnimationFrame(update);
        } else if (!isPageVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });

    // 出现动画
    function appendWithFade(element, parent) {
        parent.appendChild(element);
        element.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration: 3000,
            easing: 'ease-in-out'
        });
    }


    // 开始拖拽
    function startDrag(e) {
        if (e.preventDefault) e.preventDefault();
        isDragging = true;
        character.style.cursor = 'grabbing';
        character.style.transition = null;

        // 计算点击点与角色中心的偏移
        dragOffsetX = currentX - e.clientX;
        dragOffsetY = currentY - e.clientY;
    }

    // 拖拽中
    function onDrag(e) {
        if (isDragging) {
            if (e.preventDefault) e.preventDefault();
            currentX = e.clientX + dragOffsetX;
            currentY = e.clientY + dragOffsetY;

            currentX = Math.min(Math.max(screenCornerSaveDistance, currentX), window.innerWidth - screenCornerSaveDistance);
            currentY = Math.min(Math.max(screenCornerSaveDistance, currentY), window.innerHeight - screenCornerSaveDistance);

            updatePosition();
        }
    }

    // 结束拖拽
    function endDrag() {
        if (isDragging) {
            isDragging = false;
            character.style.cursor = 'grab';
            character.style.transition = cssAnimtaion ? "all 0.1s" : null;

            velocityX = 0;
            velocityY = 0;
        }
    }

    // 爱心
    function createHeartEffect() {

        setTimeout(() => {

            if (!isFrezeeMode) return;

            const heart = document.createElement('div');
            heart.innerHTML = '❤️';
            heart.style.position = 'fixed';
            heart.style.fontSize = `${20 + Math.random() * 10}px`;
            heart.style.color = getRandomHeartColor();
            heart.style.opacity = heartOpacity;
            heart.style.pointerEvents = 'none';
            heart.style.zIndex = '9999';

            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * heartRandomDistance;
            const heartX = currentX + Math.cos(angle) * distance;
            const heartY = currentY + Math.sin(angle) * distance;

            heart.style.left = `${heartX}px`;
            heart.style.top = `${heartY}px`;
            heartsContainer.appendChild(heart);

            const duration = 1500 + Math.random() * 1000;
            const rise = 40 + Math.random() * 60;
            const drift = (Math.random() - 0.5) * 40;

            let startTime = Date.now();
            function animateHeart() {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = elapsed / duration;

                if (progress >= 1) {
                    heartsContainer.removeChild(heart);
                    return;
                }

                // 上升淡出
                heart.style.transform = `translate(${drift * progress}px, ${-rise * progress}px) scale(${(1 + progress * 0.5) * heartScale})`;
                heart.style.opacity = (1 - progress) * heartOpacity;

                requestAnimationFrame(animateHeart);
            }

            requestAnimationFrame(animateHeart);

            createHeartEffect();

        }, (Math.random() / 2) * heartDuration);
    }

    function getRandomHeartColor() {
        const colors = [
            '#ff5e7d', '#ff4d4d', '#ff3366',
            '#ff6b8b', '#ff7979', '#ff99a3'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function updatePosition() {
        character.style.left = `${currentX - screenCornerSaveDistance}px`;
        character.style.top = `${currentY - screenCornerSaveDistance}px`;
    }

    // 位置更新
    function update() {

        let currMaxSpeend = maxSpeed;
        let currAcceleration = acceleration;

        const now = Date.now();
        const deltaTime = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;

        // 正在拖拽, 不移动
        if (isDragging) {
            animationFrameId = requestAnimationFrame(update);
            return;
        }

        // 冻结模式
        if (isFrezeeMode) {

            let verticalAngle = Math.atan2(targetY - currentY, Math.abs(targetX - currentX)) * (180 / Math.PI);
            verticalAngle = Math.min(maxAngle, Math.max(-maxAngle, verticalAngle));
            verticalAngle += angleRectification;

            const facingRight = targetX > currentX;

            character.style.transform = `${facingRight ? `scaleX(${imgScale})` : `scaleX(-${imgScale})`} scaleY(${imgScale}) rotate(${verticalAngle}deg)`;
            animationFrameId = requestAnimationFrame(update);
            return;
        }

        // 闲置
        if (!isIdle && now - lastMouseMoveTime > idleTimeout) {
            isIdle = true;
            lastRandomMoveTime = now;
            newRandomMoveTarget();
        }

        // 随机移动
        if (isIdle) {
            if (now - lastRandomMoveTime > idleTimeout || Math.pow(randomMoveTargetX - currentX, 2) + Math.pow(randomMoveTargetX - currentY, 2) < 65536) {
                lastRandomMoveTime = now;
                newRandomMoveTarget();
            }
            // 添加波浪形移动路径
            randomMoveAngle += 0.02;
            radomMoveTargetY += Math.sin(randomMoveAngle) * 0.5;
            randomMoveTargetX += Math.cos(randomMoveAngle * 0.5) * 0.3;

            currMaxSpeend = idleMaxSpeed;
            currAcceleration = idleAcceleration;
        }

        const actualTargetX = isIdle ? randomMoveTargetX : targetX;
        const actualTargetY = isIdle ? radomMoveTargetY : targetY;

        let dx = actualTargetX - currentX;
        let dy = actualTargetY - currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const needMove = (isIdle && distance > 10) || (!isIdle && distance > minDistance);

        if (needMove) {
            if (distance > 0) {
                dx /= distance;
                dy /= distance;
            }

            velocityX += dx * currAcceleration * deltaTime;
            velocityY += dy * currAcceleration * deltaTime;

            //! 这边好像还有点问题
            currMaxSpeend *= deltaTime;

            const currentSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            if (currentSpeed > currMaxSpeend) {
                velocityX = (velocityX / currentSpeed) * currMaxSpeend;
                velocityY = (velocityY / currentSpeed) * currMaxSpeend;
            }
        } else {
            // 叠加近进减速
            velocityX *= Math.pow(closeFriction, deltaTime);
            velocityY *= Math.pow(closeFriction, deltaTime);
        }

        velocityX *= Math.pow(friction, deltaTime);
        velocityY *= Math.pow(friction, deltaTime);

        currentX += velocityX;
        currentY += velocityY;

        currentX = Math.min(Math.max(screenCornerSaveDistance, currentX), window.innerWidth - screenCornerSaveDistance);
        currentY = Math.min(Math.max(screenCornerSaveDistance, currentY), window.innerHeight - screenCornerSaveDistance);

        updatePosition();

        // 朝向
        const facingRight = actualTargetX > currentX;
        let verticalAngle = 0;

        if (distance > 0) {
            verticalAngle = Math.atan2(actualTargetY - currentY, Math.abs(actualTargetX - currentX)) * (180 / Math.PI);
            verticalAngle = Math.min(maxAngle, Math.max(-maxAngle, verticalAngle));
            verticalAngle += angleRectification; // 矫正
        }

        // 摇晃(这边还得微调下)
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const bobEffect = Math.sin(now / bobEffectDuration) * Math.min(120, speed) * bobEffectStergen;
        const bobEffectX = Math.sin(verticalAngle / 180 * Math.PI) * bobEffect;
        const bobEffectY = Math.cos(verticalAngle / 180 * Math.PI) * bobEffect;


        character.style.transform = `${facingRight ? `scaleX(${imgScale})` : `scaleX(-${imgScale})`} scaleY(${imgScale}) rotate(${verticalAngle}deg) translate(${bobEffectX}px, ${bobEffectY}px)`;
        animationFrameId = requestAnimationFrame(update);
    }

    function newRandomMoveTarget() {

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const safeArea = {
            minX: screenCornerSaveDistance,
            maxX: windowWidth - screenCornerSaveDistance,
            minY: screenCornerSaveDistance,
            maxY: windowHeight - screenCornerSaveDistance
        };

        const minDistance = Math.min(windowWidth, windowHeight) * minRandomMoveRatio;
        const minDistanceSq = minDistance * minDistance;

        let newX, newY, attempts = 0;

        do {
            newX = Math.random() * (safeArea.maxX - safeArea.minX) + safeArea.minX;
            newY = Math.random() * (safeArea.maxY - safeArea.minY) + safeArea.minY;

            const dx = newX - currentX;
            const dy = newY - currentY;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq >= minDistanceSq) break;

        } while (++attempts < maxRandomMoveAttempts);

        randomMoveTargetX = newX;
        radomMoveTargetY = newY;
    }

    console.log("Ciallo～(∠・ω< )⌒★");
    console.log("Powered by D-Pear, Github Page: http://github.com/D-Pear/kawai-murasame")
    animationFrameId = requestAnimationFrame(update);
})();