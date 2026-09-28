import type { Article } from './types'

// The app's own interface is in English, so the names of tabs, buttons and
// switches (Customise, Knowledge, Clear on close…) are kept as they appear.
const articles: Article[] = [
  {
    id: 'what-is-a-language-model',
    title: 'Dil modeli aslında nedir?',
    summary: 'Bir sohbet botunun nasıl yazdığı, bilgisinin nereden geldiği ve neden yanılabileceği.',
    group: 'Temel bilgiler',
    body: `Dil modeli, çok büyük miktarda metinden hangi sözcüklerin genellikle hangilerinin ardından geldiğini öğrenmiş bir bilgisayar programıdır. Ona bir konuşmanın başını verdiğinizde olası bir sonraki metin parçasını tahmin eder, sonra bir sonrakini, ve bir yanıt yazana kadar böyle devam eder. Bu yüzden yanıt bir anda değil, parça parça görünür.

## Bilgisi nereden gelir

Bir modelin "bildiği" her şey, siz onu indirmeden önce, eğitimi sırasında edinilmiştir. Universal AI'da modelin kendi internet bağlantısı yoktur ve sohbetlerinizden bir şey öğrenmez: cihazınızdaki model indirildiği hâliyle kalır. Eğitiminden sonra olan hiçbir şeyi de bilemez.

## Büyük ve küçük modeller

Bir modelin büyüklüğü parametreyle, yani öğrenirken ayarlanan sayılarla ölçülür. Universal AI üç model sunar:

- **Qwen2.5 0.5B**, yaklaşık yarım milyar parametreyle
- **Llama 3.2 1B**, yaklaşık bir milyarla
- **Llama 3.2 3B**, yaklaşık üç milyarla

Tarayıcıda kullandığınız büyük asistanlar çok daha büyüktür. Küçük modeller hızlıdır ve telefona sığar, ama daha az şey bilir ve daha çok hata yapar. Bu uygulamadaki sürümler sıkıştırılmıştır; her parametre yaklaşık dört bite indirilmiştir. Bir milyar parametreli bir modelin 1 GB'tan küçük bir indirmeye sığması bu sayededir.

## Emin olmak doğru olmak demek değildir

Bir model doğruladığını değil, olası görüneni yazar. Yanlış bir şeyi doğru bir şeyle tamamen aynı kendinden emin tonla söyleyebilir; buna çoğu zaman "halüsinasyon" denir ve küçük modeller bunu daha sık yapar. Yanıtları bir başlangıç noktası olarak görün ve önemli olan her şeyi kontrol edin. Belgeler ve kaynaklar hakkındaki makale, Universal AI'ın bir yanıtı görebileceğiniz bir metne nasıl dayandırabileceğini anlatır.`,
  },
  {
    id: 'running-on-your-device',
    title: 'Bir yapay zekâ telefonda nasıl çalışabilir?',
    summary: 'WebGPU ve CPU modu, model seçimi ve bellek yetmediğinde ne olduğu.',
    group: 'Temel bilgiler',
    body: `Bir mesaj gönderdiğinizde yanıtı kendi telefonunuz ya da bilgisayarınız yazar. Yanıtlanmak üzere hiçbir şey bir sunucuya gönderilmez.

## Çalışmanın iki yolu

**WebGPU.** Tarayıcınız, WebGPU adlı bir özellik aracılığıyla web sayfalarının cihazın grafik çipini kullanmasına izin veriyorsa Universal AI modeli orada çalıştırır. Bu daha hızlı yoldur ve üç modelin üçü de kullanılabilir.

**CPU modu.** WebGPU yoksa uygulama modeli ana işlemcide çalıştırır. Daha yavaştır, ama neredeyse her yerde çalışır. Bu modda Llama 3.2 3B sunulmaz ve uygulama başlangıç için en küçük modeli önerir.

Uygulama açılırken cihazınızın neyi desteklediğini kontrol eder. Sizin seçmeniz gerekmez.

## Model seçmek

Customise sekmesi modelleri uygun oldukları cihaz türüne göre listeler:

- **Older phones:** Qwen2.5 0.5B, yaklaşık 0,4 GB'lık bir indirme
- **Most phones:** Llama 3.2 1B, yaklaşık 0,9 GB
- **Future phones:** Llama 3.2 3B, yaklaşık 2,2 GB, yalnızca WebGPU ile

Daha büyük bir model daha iyi yanıtlar verir, ama çalışırken daha fazla bellek ister.

## Bellek yetmediğinde

Bir model çalışırken belleğe sığmak zorundadır. Sığmazsa sistem uygulamayı kapatıp yeniden yükleyebilir; bu en çok iPhone ve iPad'de olur. Universal AI, yeniden başlatmadan etkilenmemesi için sohbeti siz yazdıkça kaydeder. Bir modelin yüklenmesi geçen sefer yarıda kaldıysa uygulama bir sonraki açılışta o modeli kendiliğinden yeniden denemez: tekrar deneyebilmeniz ya da daha küçük bir model seçebilmeniz için size bildirir.

## Sohbetin ne kadarını görür

Bellekten tasarruf etmek için, her mesaj gönderdiğinizde modele yalnızca en son sekiz mesaj verilir; az önce gönderdiğiniz de buna dahildir. Daha eski mesajlar ekranda kalır, ama model onları artık görmez.`,
  },
  {
    id: 'models-download-and-storage',
    title: 'Modeller nereden geliyor?',
    summary: 'Tek seferlik indirme, modellerin nerede tutulduğu ve nasıl kaldırılacağı.',
    group: 'Nasıl çalışır',
    body: `Bir model uygulamanın içine konamayacak kadar büyüktür, bu yüzden her biri ilk yüklediğinizde indirilir. Ondan sonra internet bağlantısı olmadan çalışır.

## Nereden gelirler

Model dosyaları, yapay zekâ modellerinin yayımlandığı herkese açık bir web sitesi olan Hugging Face'ten gelir. WebGPU modunda her model için küçük bir program kodu parçası da GitHub'dan gelir. Bunlar sıradan dosya indirmeleridir: bunları almak için sohbetlerinizden hiçbir şey gönderilmez, ancak her indirmede olduğu gibi bu siteler dosyaları cihazınızın istediğini görebilir.

## Nerede tutulurlar

Tarayıcınızın ya da yüklü uygulamanın bu cihazda Universal AI için ayırdığı depolama alanında. Uygulama açıldığında orada zaten bulunan bir modeli yükler, böylece yeniden indirmeden hazır olur.

Cihazınız bu alanı boşaltabilir; örneğin yer çok azaldığında ya da tarayıcıda uygulamanın site verilerini sildiğinizde. Böyle olursa modeli yeniden indirmeniz yeterlidir.

## Bir modeli kaldırmak

Customise ▸ AI model bu cihaza indirilmiş modelleri listeler. Çöp kutusu düğmesi birini siler ve yer açar. İstediğiniz zaman yeniden indirebilirsiniz.

## İkinci, daha küçük model

Belgeler, bilgi paketleri ya da web araması kullanırsanız uygulamanın ayrıca çok daha küçük, yaklaşık 23 MB'lık bir modele ihtiyacı olur; bunu ilk seferde, onu çalıştıran kodla birlikte Hugging Face'ten indirir. Bu model yanıt yazmaz. Metni sayı listelerine dönüştürür, böylece uygulama sorunuzla eşleşen bölümleri bulabilir. Bir sonraki makale bunun nasıl olduğunu anlatır.`,
  },
  {
    id: 'documents-and-sources',
    title: 'Belgeleri ve bilgi paketlerini nasıl kullanır?',
    summary: 'Yanıtlamadan önce arama, numaralı kaynaklar ve güven noktasının ne anlama geldiği.',
    group: 'Nasıl çalışır',
    body: `Küçük bir model çok şeyi aklında tutamaz. Universal AI önce arama yapıp bulduklarını modele vererek ona yardım eder. Bu tekniğe erişim (retrieval) denir.

## Soru sorduğunuzda ne olur

1. Küçük arama modeli sorunuzu, anlamını yakalayan bir sayı listesine dönüştürür.
2. Uygulama bunu, Knowledge sekmesinde açtığınız bilgi tabanlarındaki her bölümle karşılaştırır.
3. Yeterince yakın eşleşen en fazla dört bölüm, numaralandırılarak modelin aldığı talimatlara eklenir.
4. Modelden yanıt vermesi ve bir bölümden aldığı ifadeleri [1] ya da [2] gibi numarasıyla işaretlemesi istenir.

Bunların hepsi cihazınızda olur.

## Kendi belgeleriniz

Knowledge sekmesinde metin yapıştırabilir ya da .txt ve .md dosyaları ekleyebilirsiniz. Uygulama metni yaklaşık 700 karakterlik bölümlere ayırır, her birinin sayılarını hesaplar ve ikisini de bu cihazdaki depolama alanında saklar. Hiçbir şey yüklenmez.

## Hazır paketler

Knowledge sekmesi önceden hazırlanmış paketler de sunar: Simple Wikipedia'dan genel bilgi (25.000 makale, yaklaşık 17 MB) ve bir şarap paketi. Her karakterin de kendi paketi vardır. Paketler, indirdiğinizde Universal AI'ın kendi web sitesinden, telefon sürümlerinde ise uygulamanın içinden gelir ve aramalar cihazınızda yapılır.

## Sonucu okumak

Bir yanıttaki numaraya dokunarak geldiği bölümü görebilirsiniz. Renkli güven noktası, en iyi bölümün sorunuzla ne kadar yakın eşleştiğini gösterir. Yanıtın doğru olup olmadığını söylemez: bir model iyi bir bölümü yanlış anlayabilir ve küçük modeller bazen numaraları hiç koymaz. İlgili bir şey bulunamazsa model yalnızca eğitiminden yola çıkarak, kaynaksız yanıt verir.`,
  },
  {
    id: 'characters-and-safe-mode',
    title: 'Karakterler ve Safe mode aslında ne yapar?',
    summary: 'İkisi de modele verilen talimatlardır ve bu, onlara ne kadar güvenebileceğinizi belirler.',
    group: 'Nasıl çalışır',
    body: `Her konuşma, görmediğiniz ve modele nasıl davranacağını söyleyen talimatlarla başlar. Buna çoğu zaman "sistem istemi" denir. Karakterler, Safe mode ve adlarınız, hepsi bu talimatlara bir şey ekleyerek çalışır.

## Karakterler

Luigi the Chef ya da Sherlock Holmes gibi bir karakter seçmek, onun kişiliğinin ve konusunun bir tanımını ekler. O karakterin bilgi paketini indirdiyseniz o da açılır ve aynı anda yalnızca bir karakter etkin olabilir. Customise ▸ Names altında belirlenen bir ad, karakterin adının yerine geçer.

Model bir rol oynar. Gerçek kişi değildir ve kitabın tamamını okumamıştır.

## Safe mode

Safe mode, Customise'da 21+ seçeneğini açmadığınız sürece açıktır. Cinsel ya da yetişkinlere yönelik içeriği, kumarı, şiddeti, yasa dışı etkinlikleri ve diğer zararlı konuları reddetmesi için bir talimat ekler.

Bu bir filtre değil, bir talimattır. Uygulama yanıtları sonradan denetlemez ve küçük bir model talimatlara her zaman uymaz; bu nedenle Safe mode uygunsuz yanıtları daha az olası kılar ama tamamen önleyemez. Çocukların kullandığı bir cihazda göz kulak olun.

## Adlarınız

Adınızı girerseniz talimatlar modelden bunu arada bir kullanmasını ister. Asistana verdiğiniz ad ona kendine ne diyeceğini söyler. Talimatların geri kalanı gibi bunlar da cihazınızda kalır; ayarlarınızı bir Universal ID ile yedeklemediğiniz sürece.`,
  },
  {
    id: 'what-leaves-your-device',
    title: 'Cihazınızdan ne çıkar, ne zaman?',
    summary: 'Uygulamanın interneti kullandığı her durum ve tam olarak ne gönderdiği.',
    group: 'Gizlilik ve güvenlik',
    body: `Sohbetleriniz cihazınızda yanıtlanır. Universal AI'ın interneti kullandığı her durum ve bu sırada ne gönderildiği aşağıdadır.

## İndirmeler

- **Uygulamanın kendisi.** Web'de her sayfa gibi opensource.unisim.co.uk adresinden yüklenir, ardından çevrimdışı kullanım için saklanır.
- **Yapay zekâ modelleri.** Bir modeli ilk kez yüklediğinizde Hugging Face'ten, WebGPU modunda ayrıca GitHub'dan biraz program koduyla.
- **Arama modeli.** Belgeler, paketler ya da web araması ona ilk kez ihtiyaç duyduğunda, onu çalıştıran kodla birlikte Hugging Face'ten.
- **Bilgi paketleri.** Download'a dokunduğunuzda Universal AI'ın kendi web sitesinden.

Bu isteklerin hiçbiri mesajlarınızı ya da belgelerinizi içermez.

## Web araması, varsayılan olarak kapalı

Customise ▸ Online web search seçeneğini açarsanız ve cihazınız çevrimiçiyse, gönderdiğiniz her mesaj ayrıca İngilizce Wikipedia'ya arama olarak gönderilir. Sonuçlar daha sonra cihazınızda sorunuzla karşılaştırılır. Yani web araması açıkken sorularınız cihazınızdan çıkar ve Wikipedia'ya gider. Kapalıyken asla çıkmaz.

## Açtığınız bağlantılar

Kaynak bağlantıları ve Online düğmesi Wikipedia'yı ya da DuckDuckGo'yu tarayıcınızda açar. Web araması açık değilse uygulama önce size sorar. Sayfa açıldığında, her aramada olduğu gibi o site ne aradığınızı görür.

## Universal ID yedeği, oturum açana kadar kapalı

Uygulama, Customise sekmesinde oturum açana kadar Universal ID hizmetiyle hiç iletişim kurmaz. Oturum açmak, size tek kullanımlık bir kod e-postayla gönderilebilsin diye e-posta adresinizi gönderir. Bundan sonra Back up settings, Customise sekmesindeki ayarları UNI·SIM hesabınıza yükler ve onları yalnızca siz okuyabilirsiniz: tema, girdiğiniz adlar, seçtiğiniz karakter ve açma/kapama düğmeleri. Restore backup onları geri getirir.

## Asla çıkmayanlar

Sohbetleriniz, kaydettiğiniz yanıtlar ve belgeleriniz asla yüklenmez; tek bir istisnayla: web araması açıkken sorularınız yukarıda anlatıldığı gibi Wikipedia'ya gider.`,
  },
  {
    id: 'what-is-stored',
    title: 'Bu cihazda neler saklanır?',
    summary: 'Sohbetler, kaydedilen yanıtlar, belgeler ve modeller, ve her birinin nasıl silineceği.',
    group: 'Gizlilik ve güvenlik',
    body: `Universal AI'ın sakladığı her şey, tarayıcınızın ya da yüklü uygulamanın bu cihazda ona ayırdığı depolama alanındadır. Uygulama kendine ait bir şifreleme eklemez: bu alan cihazınızın geri kalanı gibi, ekran kilidiyle ve tarayıcının her sitenin verisini ayrı tutmasıyla korunur.

## Neler saklanır

- **Geçerli sohbet.** Uygulama yeniden başlatılırsa kaybolmasın diye siz yazdıkça kaydedilir. Varsayılan olarak açık olan Clear on close açıksa, uygulamayı kapattığınızda silinir. Sohbetteki çöp kutusu düğmesi onu istediğiniz an siler.
- **Kaydedilen yanıtlar.** Bir yanıtı kaydetmek için üzerine basılı tutun ya da sağ tıklayın. Siz kaldırana kadar kalırlar ve Clear on close onları etkilemez.
- **Belgeleriniz.** Eklediğiniz metin, bölümlere ayrılmış hâlde ve arama için kullanılan sayılarla birlikte, siz Knowledge sekmesinde silene kadar.
- **Modeller ve bilgi paketleri.** Siz Customise'da ya da Knowledge sekmesinde silene kadar.
- **Ayarlarınız.** Tema, adlar, karakter ve düğmeler.
- **Universal ID oturumunuz.** Oturum açtıysanız, çıkış yapana kadar.

## Her şeyi silmek

Her şeyi tek seferde kaldırmak için tarayıcı ayarlarından Universal AI'ın site verilerini silin ya da telefonda uygulamayı kaldırın. Universal ID'nizle saklanan bir ayar yedeği bundan etkilenmez.

## Paylaşılan bir cihazda

Bu cihazda Universal AI'ı açabilen herkes kaydedilen yanıtları ve, Clear on close kapalıysa, geçerli sohbeti okuyabilir.`,
  },
]

export default articles
