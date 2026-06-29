/**
 * AETHER LIVE - Passcode Locked Video Landing Page
 * ==========================================================================
 * يحتوي هذا الملف على:
 * 1. التحقق من كلمة المرور المكونة من 6 أرقام
 * 2. فتح الفيديو عند إدخال الرمز الصحيح مع تأثير انتقالي سلس
 * 3. الاهتزاز عند إدخال رمز خاطئ
 * 4. التحكم في كتم وتفعيل الصوت
 * 5. حماية المحتوى (منع النقر اليمين والأدوات التطويرية)
 */

// ==========================================================================
// ⚙️ الإعدادات - يمكن تعديلها بسهولة | SETTINGS (Easy to edit)
// ==========================================================================

/** 
 * 🔑 كلمة المرور من 6 أرقام | 6-digit Passcode
 * لتغييرها، عدّل الأرقام أدناه فقط.
 * To change it, just edit the numbers below.
 */
const PASSCODE = "200408";

/**
 * 📹 مسار ملف الفيديو المحلي | Local Video Path
 * ضع ملف الفيديو بهذا الاسم داخل مجلد videos لتغيير الفيديو.
 * Replace the file inside the videos/ folder with the same name to swap the video.
 */
const videoUrl = "videos.mp4";

// ==========================================================================
// ربط عناصر الواجهة | DOM Element References
// ==========================================================================
const loadingScre   = document.getElementById('loading-screen');
const passcodeScre  = document.getElementById('passcode-screen');
const pinDots       = document.getElementById('pin-dots');
const dots          = pinDots.querySelectorAll('.dot');
const keys          = document.querySelectorAll('.num-key');
const keyDelete     = document.getElementById('key-delete');
const keyClear      = document.getElementById('key-clear');
const bgVideo       = document.getElementById('bg-video');
const audioControls = document.getElementById('audio-controls');
const soundToggle   = document.getElementById('sound-toggle-btn');
const iconMuted     = document.getElementById('icon-muted');
const iconUnmuted   = document.getElementById('icon-unmuted');
const playFallback  = document.getElementById('play-fallback');
const playTrigger   = document.getElementById('playback-trigger');

// حالة إدخال المستخدم | Current input state
let currentInput = "";
const MIN_LOAD_TIME = 800;
const startTime = Date.now();

// ==========================================================================
// 1. تهيئة الفيديو وبدء التحميل | Video Init & Preloading
// ==========================================================================
function initVideo() {
    bgVideo.src = videoUrl;
    bgVideo.load();
    bgVideo.muted = true;
    bgVideo.loop = true;
    bgVideo.playsinline = true;

    bgVideo.addEventListener('loadeddata', () => {
        hideLoader();
    });

    bgVideo.addEventListener('error', () => {
        console.error("خطأ في تحميل الفيديو. Error loading video.");
        hideLoader();
    });
}

function hideLoader() {
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, MIN_LOAD_TIME - elapsed);
    setTimeout(() => {
        loadingScre.classList.add('fade-out');
    }, delay);
}

// ==========================================================================
// 2. منطق إدخال رمز المرور | PIN Entry Logic
// ==========================================================================

/** إضافة رقم جديد للإدخال */
function addDigit(digit) {
    if (currentInput.length >= 6) return;
    currentInput += digit;
    updateDots();
    if (currentInput.length === 6) {
        setTimeout(verifyPin, 120); // تأخير بسيط قبل التحقق للإحساس بالاكتمال
    }
}

/** حذف آخر رقم */
function deleteDigit() {
    if (currentInput.length === 0) return;
    currentInput = currentInput.slice(0, -1);
    updateDots();
}

/** مسح كل الأرقام */
function clearAll() {
    currentInput = "";
    updateDots();
}

/** تحديث حالة النقاط المرئية */
function updateDots() {
    dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < currentInput.length);
        dot.classList.remove('error');
    });
}

/** التحقق من الرمز */
function verifyPin() {
    if (currentInput === PASSCODE) {
        handleCorrectPin();
    } else {
        handleWrongPin();
    }
}

/** عند الرمز الصحيح: فتح الفيديو */
function handleCorrectPin() {
    // إظهار جميع النقاط مضيئة لحظة قبل الانتقال
    dots.forEach(dot => dot.classList.add('filled'));

    setTimeout(() => {
        passcodeScre.classList.add('unlocked');
        startVideoPlayback();
    }, 350);
}

/** عند الرمز الخاطئ: اهتزاز وإعادة تعيين */
function handleWrongPin() {
    dots.forEach(dot => {
        dot.classList.remove('filled');
        dot.classList.add('error');
    });

    pinDots.classList.add('shake');

    pinDots.addEventListener('animationend', () => {
        pinDots.classList.remove('shake');
        dots.forEach(dot => dot.classList.remove('error'));
        currentInput = "";
        updateDots();
    }, { once: true });
}

// ==========================================================================
// 3. تشغيل الفيديو بعد فتح الشاشة | Start Video After Unlock
// ==========================================================================
function startVideoPlayback() {
    const playPromise = bgVideo.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            bgVideo.classList.add('visible');
            audioControls.classList.remove('hidden');
        }).catch(() => {
            // المتصفح منع التشغيل التلقائي، عرض زر البدء اليدوي
            playFallback.classList.remove('hidden');
        });
    } else {
        bgVideo.classList.add('visible');
        audioControls.classList.remove('hidden');
    }
}

// زر البدء اليدوي لأجهزة iOS وغيرها
playTrigger.addEventListener('click', () => {
    bgVideo.play().then(() => {
        bgVideo.classList.add('visible');
        playFallback.classList.add('hidden');
        audioControls.classList.remove('hidden');
    }).catch(err => console.error("تعذر التشغيل:", err));
});

// ==========================================================================
// 4. ربط الأحداث للوحة المفاتيح الرقمية | Keypad Events
// ==========================================================================
keys.forEach(key => {
    key.addEventListener('click', () => addDigit(key.dataset.value));
});

keyDelete.addEventListener('click', deleteDigit);
keyClear.addEventListener('click', clearAll);

// دعم لوحة مفاتيح الجهاز (Keyboard Support)
document.addEventListener('keydown', (e) => {
    if (passcodeScre.classList.contains('unlocked')) return; // تجاهل بعد الفتح
    if (e.key >= '0' && e.key <= '9') {
        addDigit(e.key);
    } else if (e.key === 'Backspace') {
        deleteDigit();
    } else if (e.key === 'Escape' || e.key === 'Delete') {
        clearAll();
    }
});

// ==========================================================================
// 5. التحكم في الصوت | Audio Toggle
// ==========================================================================
soundToggle.addEventListener('click', () => {
    if (bgVideo.muted) {
        bgVideo.muted = false;
        iconMuted.classList.add('hidden');
        iconUnmuted.classList.remove('hidden');
        soundToggle.classList.remove('is-muted');
    } else {
        bgVideo.muted = true;
        iconMuted.classList.remove('hidden');
        iconUnmuted.classList.add('hidden');
        soundToggle.classList.add('is-muted');
    }
});

// ==========================================================================
// 6. حماية المحتوى | Content Protection
// ==========================================================================
window.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', (e) => {
    if (e.key === 'F12') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) {
        e.preventDefault(); return false;
    }
    if (e.ctrlKey && ['U','u','S','s'].includes(e.key)) {
        e.preventDefault(); return false;
    }
});

document.addEventListener('dragstart', e => {
    if (['VIDEO','IMG'].includes(e.target.nodeName)) e.preventDefault();
});

// ==========================================================================
// تشغيل النظام عند تحميل الصفحة | Bootstrap
// ==========================================================================
window.addEventListener('DOMContentLoaded', initVideo);
