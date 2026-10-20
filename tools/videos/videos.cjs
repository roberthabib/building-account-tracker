// Explainer video scripts. Normally run through run.cjs (see README.md).
// Direct use: node videos.cjs <outDir> [en,ar] [id,id,...] with the demo
// server and the app already running.
// Every video runs against the made-up "Cedar Residence" demo building.
const fs = require("fs");
const path = require("path");
const { launch, record, MOCK } = require("./recorder.cjs");

const T = {
  en: { kOwner: "For the building owner", kTenant: "For tenants", end: ["Building Account", "That's it!", "More videos: More → Help & videos."] },
  ar: { kOwner: "لمالك المبنى", kTenant: "للمستأجرين", end: ["حساب المبنى", "هذا كل شيء!", "المزيد من الفيديوهات: المزيد ← المساعدة والفيديوهات."] },
};

const nav = (view) => `.bottom-nav .nav-button[data-view="${view}"]`;
const more = (view) => `#moreView .more-menu-item[data-view="${view}"]`;
const section = (n) => `#reportsBody .report-section:nth-child(${n})`;
const DEMO_DIR = path.join(require("os").tmpdir(), "bat-video-demo");
fs.mkdirSync(DEMO_DIR, { recursive: true });
const INVOICE = path.join(DEMO_DIR, "invoice.jpg");
const PROOF = path.join(DEMO_DIR, "transfer.jpg");

async function setSelect(d, sel, value) {
  await d.point(sel);
  await d.page.locator(sel).first().selectOption(value);
  await d.wait(700);
}
async function attach(d, buttonSel, file) {
  const [chooser] = await Promise.all([d.page.waitForEvent("filechooser"), d.tap(buttonSel, 0)]);
  await chooser.setFiles(file);
  await d.wait(1000);
}
async function openMore(d, view) {
  await d.tap("#moreNavButton", 900);
  await d.tap(more(view), 1100);
}
async function inviteCode(tenantId) {
  const res = await fetch(`${MOCK}/rest/v1/rpc/create_claim_code`, { method: "POST", headers: { Authorization: "Bearer demo-owner-1", "Content-Type": "application/json" }, body: JSON.stringify({ p_tenant_id: tenantId }) });
  return String(await res.json());
}
// Links this browser to tenant t2 (Lina) before the recording starts.
async function linkTenant(page) {
  const code = await inviteCode("t2");
  await page.click("#connectBuildingButton");
  await page.fill("#connectCodeInput", code);
  await page.click("#connectSubmitButton");
  await page.waitForSelector("#dashboardView", { state: "visible", timeout: 15000 });
  await page.waitForTimeout(1500);
}

const VIDEOS = [
  // ───────────────────────────── owner ─────────────────────────────
  {
    id: "tour", role: "owner",
    title: { en: "A quick tour", ar: "جولة سريعة" },
    sub: { en: "Where everything is in the app", ar: "أين تجد كل شيء في التطبيق" },
    async script(d) {
      const s = d.ar ? {
        a: "هذه الشاشة الرئيسية. تُظهر وضع حساب المبنى لهذا الشهر.",
        b: "«يحتاج انتباهاً» يذكّرك بما يجب فعله. اضغط على أي سطر لتذهب إليه مباشرة.",
        c: "لا تحتاج تذكيراً ما؟ اضغط × لإخفائه لأسبوع أو شهر أو نهائياً.",
        d: "اختر الشهر من هنا.",
        e: "تحت ذلك: النقد في الصندوق، والمصاريف، وما يدين به المستأجرون.",
        f: "الأزرار في الأسفل تنقلك إلى الدفعات والمستأجرين والسجل.",
        g: "«المزيد» يفتح بقية الأقسام: المولّد، والتصويت، والصيانة، والتقارير، والإعدادات…",
        h: "وزر + في الأعلى يضيف دفعة أو مصروفاً من أي شاشة.",
      } : {
        a: "This is the home screen. It shows where the building's account stands this month.",
        b: "Needs Attention reminds you what to do next. Tap any line to go straight there.",
        c: "Don't need a reminder? Tap × to hide it for a week, a month, or for good.",
        d: "Pick the month here.",
        e: "Below: the cash in the box, the expenses, and what tenants owe.",
        f: "The buttons at the bottom take you to Payments, Tenants and the Ledger.",
        g: "More opens everything else: generator, votes, maintenance, reports, settings…",
        h: "And the + button at the top adds a payment or an expense from any screen.",
      };
      await d.say(s.a);
      await d.point(".attention-item");
      await d.say(s.b);
      await d.point(".attention-hide");
      await d.say(s.c);
      await d.hush();
      await d.point("#monthChips button:last-child");
      await d.say(s.d, "bottom", 1800);
      await d.hush();
      await d.hideFinger();
      await d.scroll("#kpiGrid", 0, 900);
      await d.say(s.e, "top");
      await d.hush();
      await d.tap(nav("paymentsView"), 1200);
      await d.say(s.f, "top", 2000);
      await d.tap(nav("tenantsView"), 1400);
      await d.tap(nav("ledgerView"), 1400);
      await d.hush();
      await d.tap("#moreNavButton", 1000);
      await d.say(s.g, "top");
      await d.poster();
      await d.hush();
      await d.tap(nav("dashboardView"), 900);
      await d.point("#openAddButton");
      await d.say(s.h);
    },
  },
  {
    id: "payment", role: "owner",
    title: { en: "Record a payment", ar: "تسجيل دفعة" },
    sub: { en: "With its receipt, in a few taps", ar: "مع الإيصال، ببضع ضغطات" },
    async script(d) {
      const s = d.ar ? {
        a: "دفع أحد المستأجرين؟ اضغط + ثم «تسجيل دفعة».",
        b: "اختر المستأجر…",
        c: "…واكتب المبلغ. يمكنك اختيار الدولار أو الليرة.",
        d: "حدّد طريقة الدفع: نقداً، تحويل مصرفي، OMT، Whish أو شيك.",
        e: "اضغط «إضافة». يُحفظ الإيصال ويتحدّث الرصيد فوراً.",
        f: "دفع عدة مستأجرين معاً؟ «من دفع؟» يسجّل الجميع دفعة واحدة، ولكلٍّ إيصاله.",
        g: "ضع علامة على من دفع، وصحّح المبلغ إن لزم، ثم احفظ.",
      } : {
        a: "A tenant paid? Tap + and choose Record a payment.",
        b: "Pick the tenant…",
        c: "…and type the amount. Dollars or Lebanese pounds.",
        d: "Choose how they paid: cash, bank, OMT, Whish or cheque.",
        e: "Tap Add. The receipt is saved and the balance updates straight away.",
        f: "Several tenants paid? \"Who paid?\" records them all at once, each with a receipt.",
        g: "Tick who paid, fix an amount if needed, and save.",
      };
      await d.tap(nav("paymentsView"), 1000);
      await d.point("#openAddButton");
      await d.say(s.a, "bottom", 2200);
      await d.tap("#openAddButton", 800);
      await d.tap('.entry-chooser-btn[data-category="Payments"]', 1000);
      await d.say(s.b, "top", 1600);
      await setSelect(d, "#transactionTenant", "t4");
      await d.say(s.c, "top", 1800);
      await d.type("#transactionAmount", "120", 600);
      await d.point("#currencyToggle");
      await d.wait(900);
      await d.say(s.d, "top", 2400);
      await setSelect(d, "#transactionMethod", "whish");
      await d.poster();
      await d.say(s.e, "top", 1500);
      await d.tap("#transactionSubmitButton", 2600);
      await d.hush();
      await d.point("#whoPaidButton");
      await d.say(s.f, "bottom");
      await d.tap("#whoPaidButton", 1200);
      const ticks = d.page.locator("#toolDialog .whopaid-row .recurring-tick");
      await d.say(s.g, "top", 1500);
      await d.tap(ticks.nth(0), 600);
      await d.tap(ticks.nth(2), 900);
      await d.hush();
      await d.tap("#closeToolDialog", 800);
    },
  },
  {
    id: "expense", role: "owner",
    title: { en: "Record an expense", ar: "تسجيل مصروف" },
    sub: { en: "With a photo of the invoice", ar: "مع صورة الفاتورة" },
    async script(d) {
      const s = d.ar ? {
        a: "دفعت فاتورة للمبنى؟ اضغط + ثم «تسجيل مصروف».",
        b: "اكتب ما هو المصروف والمبلغ.",
        c: "أضف المورّد والفئة: يتذكّرها التطبيق للمرة القادمة.",
        d: "التقط صورة للفاتورة أو اخترها من الهاتف. تُحفظ مع المصروف.",
        e: "من أين دُفع: من الصندوق أو من المصرف.",
        f: "اضغط «إضافة». يُقسَم المصروف على الشقق حسب المعامل تلقائياً.",
        g: "تجده في السجل. اضغط عليه لفتح الصورة أو التعديل.",
      } : {
        a: "Paid a bill for the building? Tap + and choose Record an expense.",
        b: "Type what it was for and the amount.",
        c: "Add the supplier and a category. The app remembers them for next time.",
        d: "Take a photo of the invoice, or pick one from the phone. It's kept with the expense.",
        e: "Say where the money came from: the cash box or the bank.",
        f: "Tap Add. The cost is split between the flats by their share automatically.",
        g: "It's in the Ledger. Tap it to see the photo or make a change.",
      };
      await d.point("#openAddButton");
      await d.say(s.a, "bottom", 2200);
      await d.tap("#openAddButton", 800);
      await d.tap('.entry-chooser-btn[data-category="Expenses"]', 1000);
      await d.say(s.b, "top", 1600);
      await d.type("#transactionDescription", d.ar ? "تصليح مضخة المياه" : "Water pump repair", 300);
      await d.type("#transactionAmount", "150", 600);
      await d.say(s.c, "top", 1600);
      await d.type("#transactionSupplier", d.ar ? "محل الكهرباء" : "Electro Shop", 300);
      await d.type("#transactionExpenseCategory", d.ar ? "تصليحات" : "Repairs", 500);
      await d.say(s.d, "top", 1800);
      await attach(d, "#uploadInvoicePhotoButton", INVOICE);
      await d.say(s.e, "top", 2000);
      await setSelect(d, "#transactionPaidFrom", "cash");
      await d.poster();
      await d.say(s.f, "top", 1500);
      await d.tap("#transactionSubmitButton", 2400);
      await d.hush();
      await d.tap(nav("ledgerView"), 1400);
      await d.say(s.g, "bottom");
    },
  },
  {
    id: "group", role: "owner",
    title: { en: "Share balances with the group", ar: "مشاركة الأرصدة مع المجموعة" },
    sub: { en: "One picture for the building's WhatsApp group", ar: "صورة واحدة لمجموعة واتساب المبنى" },
    async script(d) {
      const s = d.ar ? {
        a: "في آخر الشهر، أرسل الأرصدة للجميع. افتح «الدفعات» ثم «تذكير المتأخرين».",
        b: "يمكنك تذكير كل مستأجر على حدة عبر واتساب…",
        c: "…أو مشاركة صورة واحدة بكل الأرصدة مع مجموعة المبنى.",
        d: "تُنشأ الصورة فوراً. اختر واتساب ثم مجموعة المبنى.",
      } : {
        a: "At the end of the month, send everyone their balance. Open Payments, then Message Due.",
        b: "You can remind each tenant on WhatsApp, one by one…",
        c: "…or share one picture with every balance to the building's group.",
        d: "The picture is made instantly. Choose WhatsApp, then the building group.",
      };
      await d.tap(nav("paymentsView"), 1000);
      await d.say(s.a, "bottom", 2200);
      await d.tap("#whatsappAllDueButton", 1200);
      await d.say(s.b, "top", 2200);
      await d.point("#whatsappGroupButton");
      await d.say(s.c, "top", 2200);
      await d.hush();
      await d.tap("#whatsappGroupButton", 200);
      await d.say(s.d, "top", 1500);
      await d.wait(3200);
      await d.poster();
      await d.wait(1200);
    },
  },
  {
    id: "generator", role: "owner",
    title: { en: "Generator readings and bills", ar: "قراءات المولّد والفواتير" },
    sub: { en: "Split fairly by what each flat used", ar: "تقسيم عادل حسب استهلاك كل شقة" },
    async script(d) {
      const s = d.ar ? {
        a: "المولّد في «المزيد» ← «الخدمات».",
        b: "سجّل المازوت والصيانة كمصاريف مولّد عبر زر +.",
        c: "كل شهر، أدخل قراءات العدّادات. يوزَّع المازوت حسب الاستهلاك، والصيانة حسب حجم القاطع.",
        d: "لكل شقة فاتورتها. اضغط «الفاتورة» لإرسال صورة واضحة للمستأجر.",
      } : {
        a: "The generator lives under More → Services.",
        b: "Log fuel and maintenance as generator expenses with the + button.",
        c: "Each month, enter the meter readings. Fuel is shared by what each flat used, maintenance by breaker size.",
        d: "Every flat gets its own bill. Tap Bill to send the tenant a clear picture.",
      };
      await d.tap("#moreNavButton", 900);
      await d.say(s.a, "top", 1600);
      await d.tap(more("servicesView"), 1200);
      await d.say(s.b, "top", 2000);
      const readings = d.page.locator(".enter-readings-btn").first();
      await d.point(readings);
      await d.say(s.c, "top");
      await d.tap(readings, 1500);
      await d.scrollIn("#generatorBillDialog", 260, 1200);
      await d.hush();
      await d.tap("#cancelGeneratorBillButton", 900);
      const bill = d.page.locator(".gen-bill-share").first();
      await d.point(bill);
      await d.say(s.d, "top", 2000);
      await d.tap(bill, 1500);
      await d.poster();
      await d.wait(2800);
    },
  },
  {
    id: "invite", role: "owner",
    title: { en: "Invite your tenants", ar: "دعوة المستأجرين" },
    sub: { en: "Each tenant gets the app on their phone", ar: "كل مستأجر يحصل على التطبيق على هاتفه" },
    async script(d) {
      const s = d.ar ? {
        a: "افتح «المستأجرون». تحت كل اسم: هل الهاتف مرتبط، وهل الإشعارات مفعّلة.",
        b: "اضغط «دعوة الجميع» لإرسال دعوة لكل مستأجر.",
        c: "اضغط «إرسال الدعوة»: تُفتح رسالة واتساب جاهزة فيها الرمز وكيفية تثبيت التطبيق.",
        d: "الرمز يعمل مرة واحدة. بعد ذلك يرى المستأجر رصيده وإيصالاته على هاتفه.",
      } : {
        a: "Open Tenants. Under each name: is their phone linked, and are notifications on.",
        b: "Tap Invite all to send every tenant an invitation.",
        c: "Tap Send invite: WhatsApp opens with a ready message, the code, and how to install the app.",
        d: "The code works once. Then the tenant sees their balance and receipts on their phone.",
      };
      await d.tap(nav("tenantsView"), 1200);
      await d.point(".tenant-link-line");
      await d.say(s.a, "top");
      await d.point("#inviteAllButton");
      await d.say(s.b, "top", 1800);
      await d.tap("#inviteAllButton", 1500);
      await d.say(s.c, "top", 1500);
      await d.tap(d.page.locator("#toolDialog .health-row button").first(), 1200);
      await d.poster();
      await d.wait(4000);
      await d.say(s.d, "top", 2400);
      await d.hush();
      await d.tap(d.page.locator("#toolDialog .button-row button").last(), 900);
    },
  },
  {
    id: "reports", role: "owner",
    title: { en: "Reports and closing the month", ar: "التقارير وإقفال الشهر" },
    sub: { en: "Monthly report, cash count, health check", ar: "تقرير شهري، عدّ النقد، فحص البيانات" },
    async script(d) {
      const s = d.ar ? {
        a: "التقارير في «المزيد» ← «التقارير».",
        b: "التقرير الشهري: صفحة واحدة للسكان، جاهزة للمشاركة.",
        c: "«سلامة البيانات» يجد الأخطاء ويأخذك لإصلاحها.",
        d: "مرة في الشهر، اضغط «جرد الصندوق» واكتب ما في الصندوق وفي المصرف.",
        e: "يقارن التطبيق مع الدفاتر فوراً.",
        f: "عندما ترسل أرصدة الشهر، أقفله. لا تتغيّر أرقامه بالخطأ بعد ذلك.",
      } : {
        a: "Reports are under More → Reports.",
        b: "The monthly report: one page for the residents, ready to share.",
        c: "Data health finds mistakes and takes you to fix them.",
        d: "Once a month, count the cash: type what's in the box and in the bank.",
        e: "The app compares it with the books straight away.",
        f: "Once you've sent a month's balances, close it. Its figures can't change by accident.",
      };
      await d.tap("#moreNavButton", 900);
      await d.say(s.a, "top", 1500);
      await d.tap(more("reportsView"), 1200);
      await d.say(s.b, "top", 1800);
      await d.tap(`${section(1)} .primary-button`, 900);
      await d.poster();
      await d.wait(3600);
      await d.scroll(section(2), 0, 800);
      await d.say(s.c, "top");
      await d.scroll(section(9), 0, 800);
      await d.say(s.d, "top", 1800);
      await d.tap(`${section(9)} .primary-button`, 1200);
      const nums = d.page.locator('#toolDialog input[type="number"]');
      await d.type(nums.nth(0), "1685", 300);
      await d.type(nums.nth(2), "440", 900);
      await d.say(s.e, "top", 2200);
      await d.hush();
      await d.tap("#closeToolDialog", 900);
      await d.scroll(section(10), 0, 800);
      await d.say(s.f, "top", 2200);
      await d.tap(d.page.locator(`${section(10)} .month-lock-row button`).last(), 1500);
    },
  },
  {
    id: "maintenance", role: "owner",
    title: { en: "Maintenance calendar", ar: "روزنامة الصيانة" },
    sub: { en: "Never miss an inspection or a cleaning", ar: "لا تفوّت أي كشف أو تنظيف" },
    async script(d) {
      const s = d.ar ? {
        a: "«المزيد» ← «الصيانة»: كل ما يتكرر، مع موعده القادم.",
        b: "اقترب موعد؟ يظهر في «بحاجة إلى انتباه» على الشاشة الرئيسية.",
        c: "عند الانتهاء، اضغط «تم الإنجاز». يمكنك تسجيل الكلفة كمصروف مباشرة.",
        d: "ويُحسب الموعد التالي تلقائياً.",
        e: "أضف مهمة جديدة: الاسم وكل كم شهراً تتكرر.",
      } : {
        a: "More → Maintenance: everything that repeats, with when it's next due.",
        b: "When one comes up, it shows in Needs Attention on the home screen.",
        c: "When it's done, tap Mark done. You can record the cost as an expense right there.",
        d: "The next date is worked out for you.",
        e: "Add a new task: a name and how often it repeats.",
      };
      await openMore(d, "maintenanceView");
      await d.say(s.a, "top");
      await d.say(s.b, "top", 2000);
      await d.poster();
      const done = d.page.locator("#maintenanceView .primary-button, #maintenanceView .mini-button").filter({ hasText: d.ar ? /تم|أنجز/ : /done/i }).first();
      await d.point(done);
      await d.say(s.c, "top", 2200);
      await d.tap(done, 1300);
      const cost = d.page.locator('#toolDialog input[type="number"]').first();
      if (await cost.count()) await d.type(cost, "120", 600);
      await d.tap(d.page.locator("#toolDialog .button-row .primary-button").first(), 1500);
      await d.say(s.d, "top", 1800);
      await d.hush();
      await d.tap("#newMaintenanceButton", 1100);
      await d.say(s.e, "top", 1500);
      await d.type(d.page.locator("#toolDialog input").first(), d.ar ? "فحص طفايات الحريق" : "Fire extinguisher check", 800);
      await d.hush();
      await d.tap(d.page.locator("#toolDialog .button-row .primary-button").first(), 1500);
    },
  },
  {
    id: "residents", role: "owner",
    title: { en: "Notices, votes and problems", ar: "الإعلانات والتصويت والمشاكل" },
    sub: { en: "Keep the residents in the loop", ar: "أبقِ المستأجرين على اطلاع" },
    async script(d) {
      const s = d.ar ? {
        a: "«الإعلانات»: انشر خبراً يصل إلى هواتف المستأجرين.",
        b: "«التصويت»: اطرح سؤالاً. يُحتسب كل صوت حسب حصة الشقة.",
        c: "«المشاكل»: ما يبلّغ عنه المستأجرون، مع الصورة. غيّر الحالة ليعرفوا أين وصل التصليح.",
      } : {
        a: "Notices: post news that reaches the residents' phones.",
        b: "Polls: ask a question. Each vote can count by the flat's share.",
        c: "Problems: what residents report, with a photo. Change the status so they know where the repair is.",
      };
      await openMore(d, "noticesView");
      await d.say(s.a, "top");
      await d.tap("#newNoticeButton", 1100);
      await d.type(d.page.locator("#toolDialog input").first(), d.ar ? "تنظيف الدرج يوم السبت" : "Stairs cleaning on Saturday", 900);
      await d.hush();
      await d.tap("#closeToolDialog", 800);
      await openMore(d, "pollsView");
      await d.say(s.b, "top");
      await d.poster();
      await openMore(d, "issuesView");
      await d.say(s.c, "top");
    },
  },
  // ───────────────────────────── tenant ─────────────────────────────
  {
    id: "join", role: "tenant",
    title: { en: "Join with your invite code", ar: "الانضمام برمز الدعوة" },
    sub: { en: "For tenants, the first time", ar: "للمستأجرين، في المرة الأولى" },
    async setup(page) { page.__code = await inviteCode("t2"); },
    async script(d) {
      const s = d.ar ? {
        a: "وصلتك رسالة دعوة من مالك المبنى؟ افتح الرابط على هاتفك.",
        b: "اضغط «أنا مستأجر ولديّ رمز دعوة».",
        c: "اكتب الرمز الموجود في الرسالة، ثم «ربط هذا الهاتف».",
        d: "هذا كل شيء! ترى الآن رصيدك وإيصالاتك وأخبار المبنى.",
        e: "نصيحة: من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية» ليصبح كتطبيق.",
      } : {
        a: "Got an invite from the building owner? Open the link on your phone.",
        b: "Tap \"I'm a tenant with an invite code\".",
        c: "Type the code from the message, then tap Link this phone.",
        d: "That's it! You now see your balance, receipts and building news.",
        e: "Tip: in your browser's menu choose \"Add to Home Screen\" to keep it like an app.",
      };
      await d.say(s.a, "top");
      await d.point("#connectBuildingButton");
      await d.say(s.b, "top", 1600);
      await d.tap("#connectBuildingButton", 1000);
      await d.say(s.c, "top", 1500);
      await d.type("#connectCodeInput", d.page.__code, 600);
      await d.tap("#connectSubmitButton", 3500);
      await d.say(s.d, "top");
      await d.poster();
      await d.say(s.e, "top");
    },
  },
  {
    id: "tenant-home", role: "tenant",
    title: { en: "Your balance and payments", ar: "رصيدك ودفعاتك" },
    sub: { en: "See what you owe and tell the owner you paid", ar: "اعرف ما عليك وأبلغ المالك أنك دفعت" },
    setup: linkTenant,
    async script(d) {
      const s = d.ar ? {
        a: "الشاشة الرئيسية تُظهر ما عليك هذا الشهر، وكيف حُسب.",
        b: "دفعت؟ اضغط «لقد دفعت» لإبلاغ المالك. أرفق صورة التحويل إن وُجدت.",
        c: "يصل البلاغ إلى المالك ليؤكّده.",
        d: "دفعاتك الأخيرة هنا. اضغط «إيصال» لتنزيله.",
      } : {
        a: "Your home screen shows what you owe this month, and how it's worked out.",
        b: "Paid? Tap I've Paid to tell the owner. Add a photo of the transfer if you have one.",
        c: "The owner gets it and confirms it.",
        d: "Your recent payments are here. Tap Receipt to download one.",
      };
      await d.say(s.a, "top");
      await d.tap(nav("paymentsView"), 1200);
      const paid = d.page.locator(".paid-declaration-btn").first();
      await d.point(paid);
      await d.say(s.b, "top", 2200);
      await d.tap(paid, 1200);
      await d.type("#declareAmountInput", "98.84", 500);
      await d.poster();
      await d.tap("#declareSubmitButton", 1800);
      await d.say(s.c, "top", 1800);
      await d.hush();
      await d.tap(nav("dashboardView"), 1200);
      const receipt = d.page.locator("#dashboardView button").filter({ hasText: d.ar ? "إيصال" : "Receipt" }).first();
      if (await receipt.count()) { await d.point(receipt); await d.say(s.d, "top"); }
    },
  },
  {
    id: "tenant-more", role: "tenant",
    title: { en: "Votes, problems and notifications", ar: "التصويت والمشاكل والإشعارات" },
    sub: { en: "Take part in the building", ar: "شارك في شؤون المبنى" },
    setup: linkTenant,
    async script(d) {
      const s = d.ar ? {
        a: "في «المزيد» تجد التصويت والإعلانات والمشاكل.",
        b: "صوّت بنعم أو لا. يمكنك تغيير رأيك حتى يُغلق التصويت.",
        c: "عطل في المبنى؟ «+ إبلاغ» يرسله للمالك مع صورة، وتتابع حالته هنا.",
        d: "اضغط «تفعيل» لتصلك الأخبار والتذكيرات على هاتفك.",
      } : {
        a: "Under More you'll find votes, notices and problems.",
        b: "Vote yes or no. You can change your mind until the vote closes.",
        c: "Something broken? + Report sends it to the owner with a photo, and you follow it here.",
        d: "Turn on notifications to get news and reminders on your phone.",
      };
      await d.tap("#moreNavButton", 900);
      await d.say(s.a, "top", 1800);
      await d.tap(more("pollsView"), 1200);
      await d.say(s.b, "top", 1500);
      await d.tap(d.page.locator(".vote-btn.vote-yes").first(), 1500);
      await d.poster();
      await openMore(d, "issuesView");
      await d.say(s.c, "top", 1500);
      await d.tap("#newIssueButton", 1100);
      await d.type(d.page.locator("#toolDialog input").first(), d.ar ? "ضوء الدرج في الطابق الثاني لا يعمل" : "Stair light on floor 2 is out", 900);
      await d.hush();
      await d.tap(d.page.locator("#toolDialog .button-row .primary-button").first(), 1600);
      await d.tap("#moreNavButton", 900);
      await d.point("#pushToggleButton");
      await d.say(s.d, "top");
    },
  },
];

async function makeDemoImages(env) {
  if (fs.existsSync(INVOICE) && fs.existsSync(PROOF)) return;
  const ctx = await env.browser.newContext({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(`<body style="margin:0;background:#f7f5ef;font-family:Arial;padding:40px;color:#222">
    <div style="font-size:30px;font-weight:bold">Electro Shop</div><div style="color:#666">Electrical supplies & repairs</div>
    <div style="margin-top:30px;font-size:22px">INVOICE No. ES-2231</div><div>Date: 20/10/2026</div><div>To: Cedar Residence</div>
    <table style="margin-top:30px;width:100%;font-size:18px;border-collapse:collapse"><tr style="border-bottom:2px solid #333"><td>Item</td><td style="text-align:right">USD</td></tr>
    <tr><td>Water pump repair</td><td style="text-align:right">120.00</td></tr><tr><td>Pressure switch</td><td style="text-align:right">30.00</td></tr>
    <tr style="border-top:2px solid #333;font-weight:bold"><td>Total</td><td style="text-align:right">150.00</td></tr></table></body>`);
  await page.screenshot({ path: INVOICE, type: "jpeg", quality: 80 });
  await page.screenshot({ path: PROOF, type: "jpeg", quality: 80 });
  await ctx.close();
}

(async () => {
  const outDir = process.argv[2];
  const langs = process.argv[3] ? process.argv[3].split(",") : ["en", "ar"];
  const only = process.argv[4] ? process.argv[4].split(",") : null;
  const env = await launch();
  await makeDemoImages(env);
  const results = [];
  try {
    for (const lang of langs) {
      for (const v of VIDEOS) {
        if (only && !only.includes(v.id)) continue;
        const out = path.join(outDir, lang, `${v.id}.mp4`);
        try {
          const r = await record(env, {
            id: v.id, lang, role: v.role, out,
            intro: [v.role === "tenant" ? T[lang].kTenant : T[lang].kOwner, v.title[lang], v.sub[lang]],
            outro: T[lang].end, setup: v.setup, keepLogin: v.keepLogin, script: v.script,
          });
          results.push({ id: v.id, lang, seconds: r.seconds });
        } catch (error) {
          console.log(`  FAILED ${lang}/${v.id}: ${error.message.split("\n")[0]}`);
          results.push({ id: v.id, lang, failed: true });
        }
      }
    }
  } finally {
    await env.browser.close();
  }
  const meta = VIDEOS.map((v) => ({ id: v.id, role: v.role, title: v.title, sub: v.sub }));
  fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify({ meta, results }, null, 1));
  console.log(JSON.stringify(results));
})();
