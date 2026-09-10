document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('langSwitch');
    let currentLang = 'ar';

    const translations = {
        ar: {
            direction: 'rtl',
            langBtnText: 'English <i class="fa-solid fa-globe"></i>',
            navHome: 'الرئيسية',
            navAbout: 'من نحن',
            navContact: 'تواصل معنا',
            heroBadge: 'منصة برمجية متكاملة بـ Visual Studio Code',
            heroHeadline: 'منصة تقنية برمجية لإتقان الكود وبناء المشاريع الحقيقية',
            heroSubtext: 'Coding Master هي منصة واعدة تعمل كبيئة تطوير متكاملة مدمجة مع VS Code، تضمن ربط المفاهيم بالتطبيق المباشر، وتوفر تجربة تعلم استثنائية وبديلة للكورسات التقليدية.',
            trustedText: 'أكثر من +50 مجتمع ومؤسسة تقنية تثق بنا',
            solutionsTitle: 'الحلول التي تأخذ عملك إلى المستوى التالي',
            solutionsSub: 'نقوم بتصميم وتطوير أدوات البيئة البرمجية التي تساعدك على العمل بشكل أكثر ذكاءً وبجهد أقل',
            card1Tag: 'أتمتة سير العمل',
            card1Title: 'بناء أنظمة أكثر ذكاءً',
            card1Desc: 'نساعدك على تبسيط العمليات الداخلية من خلال أتمتة سير العمل اليدوي مثل إدخال البيانات وإعداد التقارير وسلاسل الموافقة لتوفير الوقت وتقليل الأخطاء.',
            card2Tag: 'أنظمة متكيفة',
            card2Title: 'تكامل التصميم والبيئة',
            card2Desc: 'أنظمة متوافقة مع كافة أجهزة سطح المكتب والأجهزة المحمولة لضمان تجربة أسرع في الوصول وواجهات سهلة الاستخدام لجميع التطبيقات.',
            card3Tag: 'هيكلة قوية',
            card3Title: 'تسريع نمو مهاراتك البرمجية',
            card3Desc: 'أدوات الذكاء الاصطناعي لتحليل الكود وتوفير التوجيه المباشر، مما يوسع فرصك لبناء معرض أعمال قوي ودخول سوق العمل بثقة.',
            stepsTitle: 'ماذا يقدم لك Coding Master؟',
            stepsSub: 'نظام عملي يضمن لكل مطور تجربة حقيقية ومستقرة، من خلال مسار واضح ومتدرج عبر الأنظمة التالية:',
            flowTags: 'تنفيذ ← توثيق ← تسليم ← اعتماد ← احتراف',
            btnStart: 'ابدأ الآن',
            step1Label: 'الخطوة الأولى',
            step1Title: 'بناء تجربة المستخدم مع التطبيق نفسه',
            step1Desc: 'بعد الإطلاق المباشر لأي ميزة برمجية، نعمل بالتعاون المباشر مع المطورين عبر نظام تقييم يلتقط الملاحظات ويحولها إلى تحسينات فورية ومُدارة.',
            step2Label: 'الخطوة الثانية',
            step2Title: 'ضمان جودة المشاريع ودخول سوق العمل',
            step2Desc: 'نضمن الممارسة الحقيقية بداخل البيئة عبر استلام البرمجيات بصيغة منظمة ودخول السوق بمنتج واضح المعالم.',
            step3Label: 'الخطوة الثالثة',
            step3Title: 'متابعة الأداء وبناء ملف المطور (Portfolio)',
            step3Desc: 'توثيق العمل المنجز والمشاريع، وربط الإنجاز الفعلي بملفك البرمجي وتصحيح الأخطاء فوراً.',
            gridTitle: 'ما الذي يميز Coding Master؟',
            gridSub: 'أدوات مبتكرة ورؤى قوية مصممة لرفع مستوى عملك وكودك البرمجي',
            grid1Title: 'أنظمة تكيفية',
            grid1Desc: 'استفد من الأنظمة القائمة على الذكاء الاصطناعي التي تتطور مع كودك، مما يضمن الكفاءة والابتكار في كل خطوة.',
            grid2Title: 'بيئة آمنة ومستقرة',
            grid2Desc: 'إعطاء الأولوية للسلامة باستخدام التشفير المتقدم وميزات الأمان القوية لكل تفاعل برمجية.',
            grid3Title: 'دعم مخصص',
            grid3Desc: 'يمكنك الوصول إلى مساعدة الخبراء على مدار الساعة لضمان عدم وجودك وحدك في رحلة النمو البرمجي.'
        },
        en: {
            direction: 'ltr',
            langBtnText: 'العربية <i class="fa-solid fa-globe"></i>',
            navHome: 'Home',
            navAbout: 'About Us',
            navContact: 'Contact Us',
            heroBadge: 'Integrated Coding Platform powered by Visual Studio Code',
            heroHeadline: 'A Modern Technical Platform to Master Code & Build Real Projects',
            heroSubtext: 'Coding Master is a promising platform designed as an integrated development environment linked with VS Code, bridging concepts directly with real-world practice beyond traditional courses.',
            trustedText: 'Trusted by over +50 technical & software communities',
            solutionsTitle: 'Solutions That Elevate Your Coding Skills',
            solutionsSub: 'We design & build development tools that help you work smarter with less effort',
            card1Tag: 'Workflow Automation',
            card1Title: 'Building Smarter Systems',
            card1Desc: 'We streamline internal processes by automating manual workflows, code execution, and reporting to save time and prevent errors.',
            card2Tag: 'Adaptive Systems',
            card2Title: 'Design & IDE Integration',
            card2Desc: 'Fully responsive systems for desktop and mobile devices ensuring fast access and seamless developer user experience.',
            card3Tag: 'Solid Architecture',
            card3Title: 'Accelerating Skill Growth',
            card3Desc: 'AI-driven code analysis and real-time guidance to expand your potential, build a stellar portfolio, and enter the job market with confidence.',
            stepsTitle: 'What Does Coding Master Offer?',
            stepsSub: 'A practical framework guaranteeing a real and stable environment through clear milestones:',
            flowTags: 'Execute → Document → Deliver → Certify → Master',
            btnStart: 'Start Now',
            step1Label: 'Step 1',
            step1Title: 'Building User Experience with Direct Practice',
            step1Desc: 'Upon releasing any coding feature, we collaborate directly with developers through a feedback system to refine and upgrade instantly.',
            step2Label: 'Step 2',
            step2Title: 'Ensuring Project Quality & Career Readiness',
            step2Desc: 'We guarantee hands-on practice within the environment by delivering structured software and entering the market with a clear product.',
            step3Label: 'Step 3',
            step3Title: 'Performance Tracking & Portfolio Building',
            step3Desc: 'Documenting completed work and projects, linking actual achievements to your developer profile, and fixing bugs instantly.',
            gridTitle: 'Why Choose Coding Master?',
            gridSub: 'Innovative tools & actionable insights crafted to level up your code',
            grid1Title: 'Adaptive Systems',
            grid1Desc: 'Leverage AI systems that evolve alongside your codebase, ensuring high efficiency at every step.',
            grid2Title: 'Secure & Stable Environment',
            grid2Desc: 'Prioritizing safety with advanced encryption and robust security features for every interaction.',
            grid3Title: 'Dedicated Support',
            grid3Desc: 'Access expert support 24/7 to ensure you never walk your coding journey alone.'
        }
    };

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            const langData = translations[currentLang];

            // 1. تبديل الاتجاه
            document.documentElement.setAttribute('dir', langData.direction);

            // 2. تحديث الزر
            langBtn.innerHTML = langData.langBtnText;

            // 3. تحديث جميع العناصر عبر ID
            for (let key in langData) {
                if (key !== 'direction' && key !== 'langBtnText') {
                    const el = document.getElementById(key);
                    if (el) {
                        el.innerHTML = langData[key];
                    }
                }
            }
        });
    }
});