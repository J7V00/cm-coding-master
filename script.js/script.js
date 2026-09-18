import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router'; // لو كنت تستخدم Expo Router

export default function MyScreen() {
    const router = useRouter();
    // حالة (State) لفتح وإغلاق القائمة
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <SafeAreaView style={styles.container}>

            {/* 1. زر الثلاث خطوط ☰ (يفتح القائمة) */}
            <View style={styles.header}>
                <Pressable
                    style={styles.hamburgerBtn}
                    onPress={() => setMenuVisible(true)}
                >
                    <Text style={styles.hamburgerIcon}>☰</Text>
                </Pressable>
            </View>

            {/* 2. القائمة اللي تغطي الشاشة بالكامل (Modal) */}
            <Modal
                animationType="slide" // تطلع بحركة انسيابية من تحت
                transparent={false}
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
            >
                <View style={styles.fullScreenMenu}>

                    {/* زر الإغلاق (X) */}
                    <Pressable
                        style={styles.closeBtn}
                        onPress={() => setMenuVisible(false)}
                    >
                        <Text style={styles.closeIcon}>✕</Text>
                    </Pressable>

                    {/* محتويات القائمة */}
                    <View style={styles.menuLinks}>

                        {/* الزر حقك (خريطة القرآن) داخل القائمة */}
                        <Pressable
                            style={styles.mapButton}
                            onPress={() => {
                                setMenuVisible(false); // نقفل القائمة أول شيء
                                router.push("/map");   // بعدين نروح للخريطة
                            }}
                        >
                            <Text style={styles.mapButtonIcon}>◉</Text>
                            <Text style={styles.mapButtonText}>خريطة القرآن</Text>
                        </Pressable>

                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

// التنسيقات (الستايلات)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff', // لون خلفية الصفحة العادية
    },
    header: {
        padding: 20,
        alignItems: 'flex-start', // عشان نخلي الثلاث خطوط على اليسار
    },
    hamburgerBtn: {
        padding: 10,
    },
    hamburgerIcon: {
        fontSize: 30,
        color: '#000000',
        fontWeight: 'bold',
    },

    /* --- ستايل القائمة الشاشة الكاملة --- */
    fullScreenMenu: {
        flex: 1, // يغطي الجوال 100%
        backgroundColor: '#08080a', // لون أسود فخم (نفس الموقع حقك)
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        left: 30,
        padding: 10,
    },
    closeIcon: {
        fontSize: 35,
        color: '#ffffff',
    },
    menuLinks: {
        alignItems: 'center',
        gap: 30,
    },

    /* --- ستايل الزر حقك --- */
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mapButtonIcon: {
        fontSize: 24,
        color: '#ffffff',
        marginRight: 10,
    },
    mapButtonText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
// 1. فتح وإغلاق قائمة الجوال
function openMobileMenu() { document.getElementById('mobileMenuOverlay').classList.add('active'); }
function closeMobileMenu() { document.getElementById('mobileMenuOverlay').classList.remove('active'); }

// 2. القاموس الشامل للترجمة
const translationDict = [
    { ar: 'الرئيسية', en: 'Home' }, { ar: 'من نحن', en: 'About Us' }, { ar: 'تواصل معنا', en: 'Contact Us' }, { ar: 'التنزيلات', en: 'Downloads' },
    { ar: 'عن Coding Master', en: 'About Coding Master' },
    { ar: 'نحن نصمم بيئات برمجية وأدوات حديثة لمساعدة مشاريعك وأفكارك على التميز والنجاح.', en: 'We create beautiful, modern coding environments to help your projects stand out.' },
    { ar: 'تصفح', en: 'Navigate' },
    { ar: 'مرحباً بكم في Coding Master', en: 'Welcome to Coding Master' },
    { ar: 'هنا تبدأ الفكرة، ويبدأ معها عالم من الإبداع والبرمجة. نتعلم، نجرب، ونحوّل أفكارنا إلى مشاريع جميلة بطريقة بسيطة وواضحة.', en: 'Where ideas begin and a world of innovation unfolds. We learn, test, and build beautiful projects simply and clearly.' },
    { ar: 'الحلول التي تأخذ عملك إلى المستوى التالي', en: 'Solutions to Take Your Work to the Next Level' },
    { ar: 'أتمتة سير العمل', en: 'Workflow Automation' }, { ar: 'محرر أكواد حديث شامل', en: 'Comprehensive Code Editor' },
    { ar: 'نساعدك على بناء أنظمة أكثر ذكاءً وتبسيط العمليات البرمجية وتوفير الوقت وتفادي الأخطاء.', en: 'We help you build smarter systems, simplify workflows, save time, and avoid errors.' },
    { ar: 'تكامل التكيف', en: 'Adaptive Integration' }, { ar: 'أنظمة متكيفة لكل الأجهزة', en: 'Adaptive Systems for All Devices' },
    { ar: 'تنسيق وتكامل التصميم مع البيئة لتناسب الشاشات المحمولة واللوحية وأجهزة سطح المكتب بكفاءة عالية.', en: 'Seamlessly integrated designs for mobile, tablet, and desktop screens with high efficiency.' },
    { ar: 'هيكلة قوية', en: 'Strong Architecture' }, { ar: 'تسريع نمو مهاراتك البرمجية', en: 'Accelerate Your Skills' },
    { ar: 'تحليل الكود وتوفير التوجيه المباشر لبناء معرض أعمال قوي ودخول سوق العمل بثقة.', en: 'Code analysis and direct guidance to build a strong portfolio and enter the market confidently.' },
    { ar: 'نحن لا نكتب الكود فقط بل نحول الأفكار إلى واقع', en: 'We don\'t just write code, we turn ideas into reality' },
    { ar: 'لا نكتفي بالتعلم بل نصنع ونطور ونبتكر. لا نرى البرمجة مجرد أكواد بل نراها وسيلة لصناعة المستقبل.', en: 'We do not just learn; we create, develop, and innovate. Programming is not just code, it\'s a tool to build the future.' },
    { ar: 'نعطيك الأدوات التي تساعدك على بناء أفكارك وتطوير مهاراتك، ومن أول سطر كود تبدأ رحلة صناعة شيء مميز.', en: 'We give you the tools to build your ideas and develop your skills. From the first line of code, your journey to create something amazing begins.' },
    { ar: 'Coding Master حيث يتحول التعلم إلى إبداع', en: 'Coding Master where learning turns into creativity' },
    { ar: 'قصتنا', en: 'Our Story' }, { ar: 'كيف بدأنا الفكرة؟', en: 'How did it start?' },
    { ar: 'بدأت رحلة Coding Master من شغف حقيقي لبناء بيئة برمجية سريعة، خفيفة، وتلبي تطلعات المطورين بدون تعقيد أو بطء.', en: 'Coding Master started from a real passion to build a fast, lightweight coding environment that meets developers\' aspirations without complexity.' },
    { ar: 'رؤيتنا', en: 'Our Vision' }, { ar: 'تمكين العقول لصناعة المستقبل', en: 'Empowering Minds' },
    { ar: 'نسعى لتوفير بيئة متكاملة تمنح كل مبرمج القدرة على تحويل أفكاره إلى برمجيات حقيقية بكل سهولة واحترافية.', en: 'We strive to provide an integrated environment that gives every programmer the ability to turn their ideas into real software easily.' },
    { ar: 'فلسفتنا', en: 'Our Philosophy' }, { ar: 'تبسيط التعقيد وتسهيل التعلم', en: 'Simplifying Complexity' },
    { ar: 'نؤمن بأن الكود المعقد يمكن كتابته بطرق ذكية وبسيطة، ولذلك نبتكر أدوات تسرع وتيرة العمل وتختصر الوقت.', en: 'We believe complex code can be written smartly and simply, so we invent tools that speed up work and save time.' },
    { ar: 'مجتمعنا', en: 'Our Community' }, { ar: 'دعم مستمر وشغف لا ينتهي', en: 'Continuous Support' },
    { ar: 'نحن نعمل كعائلة واحدة تبادل الخبرات، وتساعد كل مبرمج على تجاوز العقبات وبناء معارض أعمال قوية.', en: 'We work as one family sharing experiences, helping every programmer overcome obstacles and build strong portfolios.' },
    { ar: 'هدفنا', en: 'Our Goal' }, { ar: 'إطلاق مشاريع ناجحة للجميع', en: 'Launching Successful Projects' },
    { ar: 'هدفنا النهائي هو إيصالك لخط النهاية؛ من أول سطر كود تكتبه وحتى إطلاق مشروعك النهائي أمام العالم بثقة.', en: 'Our ultimate goal is to get you to the finish line; from your first line of code until you launch your final project.' },
    { ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions' },
    { ar: 'ما الذي يجعل Coding Master مختلفاً؟', en: 'What makes Coding Master different?' },
    { ar: 'الجمع بين السرعة الخارقة، التصميم العصري الداكن، والدعم الذكي لكافة أنظمة التشغيل بدون تعقيدات.', en: 'The combination of lightning speed, dark modern design, and smart cross-platform support without complexity.' },
    { ar: 'هل التطبيق مناسب للمبتدئين؟', en: 'Is the app beginner-friendly?' },
    { ar: 'نعم، صممت البيئة لتكون واضحة وسهلة الاستخدام للمبتدئين وقوية بما يكفي للمحترفين.', en: 'Yes, the environment is designed to be clear for beginners while powerful enough for professionals.' },
    { ar: 'كيف يمكنني بدء استخدام المحرر؟', en: 'How do I start using the editor?' },
    { ar: 'كل ما عليك هو الانتقال لصفحة التنزيلات، واختيار النسخة المخصصة لنظام تشغيلك والبدء فوراً.', en: 'Just go to the Downloads page, choose your OS version, and start immediately.' },
    { ar: 'كيف يمكننا مساعدتك؟', en: 'How can we help you?' },
    { ar: 'فريقنا متواجد دائماً للرد على استفساراتك البرمجية والدعم الفني.', en: 'Our team is always available for your coding inquiries and technical support.' },
    { ar: 'أرسل لنا رسالة', en: 'Send us a message' }, { ar: 'الاسم الكامل', en: 'Full Name' },
    { ar: 'البريد الإلكتروني', en: 'Email Address' }, { ar: 'رقم الهاتف', en: 'Phone Number' },
    { ar: 'الرمز البريدي / كود الحساب', en: 'Zip Code / Account Code' }, { ar: 'الرسالة (إلزامي)', en: 'Message (Required)' },
    { ar: 'إرسال الرسالة', en: 'Send Message' }, { ar: 'أدخل اسمك هنا...', en: 'Enter your name here...' },
    { ar: 'أدخل بريدك الإلكتروني...', en: 'Enter your email...' }, { ar: 'أدخل رقم هاتفك هنا...', en: 'Enter your phone number...' },
    { ar: 'أدخل الرمز أو كود الحساب...', en: 'Enter Zip code or Account code...' }, { ar: 'اكتب رسالتك هنا...', en: 'Write your message here...' },
    { ar: 'قم بتحميل تطبيق Coding Master الآن وابدأ رحلتك في عالم البرمجة والكتابة بأبسط طريقة.', en: 'Download Coding Master now and start your coding journey in the simplest way.' },
    { ar: 'تحميل التطبيق', en: 'Download App' }, { ar: 'اختر النسخة المناسبة لجهازك وقم بتحميلها الآن', en: 'Choose the right version for your device and download it now' },
    { ar: 'لأجهزة الكمبيوتر بنظام ويندوز', en: 'For Windows computers' }, { ar: 'لأجهزة الكمبيوتر بنظام الماك', en: 'For macOS computers' },
    { ar: 'لأجهزة الكمبيوتر بنظام لينكس', en: 'For Linux computers' }, { ar: 'النسخة المحمولة', en: 'Mobile Version' },
    { ar: 'للجوالات والآيبادات والشاشات', en: 'For Phones, Tablets, and Screens' },
    { ar: 'تحميل الآن', en: 'Download Now' },
    { ar: 'جميع الحقوق محفوظة.', en: 'All Rights Reserved.' }
];

function walkTextNodes(node, lang) {
    if (node.nodeType === 3) {
        let text = node.nodeValue;
        let changed = false;
        translationDict.forEach(dict => {
            if (lang === 'en' && text.includes(dict.ar)) { text = text.replace(dict.ar, dict.en); changed = true; }
            else if (lang === 'ar' && text.includes(dict.en)) { text = text.replace(dict.en, dict.ar); changed = true; }
        });
        if (changed) node.nodeValue = text;
    } else {
        node.childNodes.forEach(child => walkTextNodes(child, lang));
    }
}

function translatePlaceholders(lang) {
    document.querySelectorAll('input, textarea').forEach(input => {
        translationDict.forEach(dict => {
            if (lang === 'en' && input.placeholder && input.placeholder.includes(dict.ar)) {
                input.placeholder = input.placeholder.replace(dict.ar, dict.en);
            } else if (lang === 'ar' && input.placeholder && input.placeholder.includes(dict.en)) {
                input.placeholder = input.placeholder.replace(dict.en, dict.ar);
            }
        });
    });
}

function applyLanguage(lang) {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    const langBtns = document.querySelectorAll('#btnLangText');
    langBtns.forEach(btn => btn.innerHTML = lang === 'ar' ? 'English' : 'العربية');
    walkTextNodes(document.body, lang);
    translatePlaceholders(lang);
    localStorage.setItem('CMLang', lang);
}

function toggleLanguage() {
    let currentLang = localStorage.getItem('CMLang') || 'ar';
    let newLang = currentLang === 'ar' ? 'en' : 'ar';
    applyLanguage(newLang);
}

document.addEventListener("DOMContentLoaded", function () {
    let savedLang = localStorage.getItem('CMLang') || 'ar';
    if (savedLang === 'en') { applyLanguage('en'); }

    // ================= نظام التنزيل الذكي =================
    function getOS() {
        const userAgent = window.navigator.userAgent.toLowerCase(), platform = window.navigator.platform.toLowerCase(), maxTouchPoints = window.navigator.maxTouchPoints || 0;
        if (/iphone|ipad|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent) || (platform === 'macintel' && maxTouchPoints > 1)) return 'Mobile';
        if (platform.includes('mac')) return 'Mac'; if (platform.includes('win')) return 'Windows'; if (platform.includes('linux')) return 'Linux';
        return 'Unknown';
    }

    const currentOS = getOS();

    function triggerNativeDownload(fileName) {
        const blob = new Blob(["Coding Master App"], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = fileName;
        document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
    }

    const btnWin = document.getElementById('btnWin');
    if (btnWin) btnWin.addEventListener('click', () => { if (currentOS === 'Mobile') alert('عفواً! يرجى اختيار النسخة المحمولة.'); else if (currentOS !== 'Windows') alert(`جهازك مخصص له ${currentOS}!`); else triggerNativeDownload('CodingMaster-Windows.exe'); });

    const btnMac = document.getElementById('btnMac');
    if (btnMac) btnMac.addEventListener('click', () => { if (currentOS === 'Mobile') alert('عفواً! يرجى اختيار النسخة المحمولة.'); else if (currentOS !== 'Mac') alert(`جهازك مخصص له ${currentOS}!`); else triggerNativeDownload('CodingMaster-Mac.dmg'); });

    const btnLin = document.getElementById('btnLin');
    if (btnLin) btnLin.addEventListener('click', () => { if (currentOS === 'Mobile') alert('عفواً! يرجى اختيار النسخة المحمولة.'); else if (currentOS !== 'Linux') alert(`جهازك مخصص له ${currentOS}!`); else triggerNativeDownload('CodingMaster-Linux.tar.gz'); });

    const btnMob = document.getElementById('btnMob');
    if (btnMob) btnMob.addEventListener('click', () => { if (currentOS !== 'Mobile') alert(`جهازك كمبيوتر! الرجاء تحميل نسخة سطح المكتب.`); else triggerNativeDownload('CodingMaster-Mobile.apk'); });
});

// نظام إرسال البريد
function sendEmail(event) {
    event.preventDefault();
    const btn = document.getElementById('btnSubmit');
    let currentLang = localStorage.getItem('CMLang') || 'ar';
    btn.innerHTML = currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...';
    btn.disabled = true;

    fetch("https://formsubmit.co/ajax/amjdbilalsalah0@gmail.com", {
        method: "POST", body: new FormData(event.target)
    }).then(() => {
        alert(currentLang === 'ar' ? "تم إرسال رسالتك بنجاح!" : "Message sent successfully!");
        event.target.reset();
        btn.innerHTML = currentLang === 'ar' ? 'إرسال الرسالة <i class="fas fa-paper-plane"></i>' : 'Send Message <i class="fas fa-paper-plane"></i>';
        btn.disabled = false;
    }).catch(() => {
        alert(currentLang === 'ar' ? "حدث خطأ!" : "Error!");
        btn.disabled = false;
    });
}