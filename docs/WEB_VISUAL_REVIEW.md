# Financial Autonomy — Premium Visual Review

Data: 22 octombrie 2026 (Europe/Bucharest)
Versiune observată în browser: **v018.21**
Preview: https://financial-autonomy-preview.vercel.app/

## Domeniu și limite

**Reconfirmare la cererea actuală:** preview-ul a fost redeschis în browser la 22 octombrie 2026. Antetul afișa tot v018.21, cu „Începe cu realitatea de azi”, Autonomie „—”, venit neconfigurat și invitație de configurare a primului buget. Datele demo automate nu au apărut în sesiunea fără date. Prin urmare, ecranele populate nu au putut fi evaluate. Acesta este același raport unic, actualizat; constatările light/dark de mai jos provin din inspecția interactivă efectuată anterior în această conversație asupra aceleiași versiuni, nu dintr-un audit al codului sursă.

**Direcție:** numai îmbunătățiri incrementale. Se păstrează identitatea cromatică, cele două carduri distincte Autonomie/Spațiu și structura funcțională existentă; nu există dovezi care să justifice un redesign complet.

Review vizual/UX interactiv, realizat în browserul ChatGPT Work. Au fost inspectate Dashboard, Finanțe, Istoric și Setări în light/dark; Bugete și formularul de configurare în light. Accentul a rămas Iris. Sesiunea era fără date financiare; nu au fost adăugate solduri sau tranzacții. Formularul de buget a fost deschis și închis fără salvare. Tema a fost schimbată numai pentru inspecție.

**Limitare importantă:** viewportul disponibil era desktop, capturi de 1363 × 936 px. API-ul disponibil nu expune redimensionarea viewportului. Nu s-a verificat randarea la dimensiuni iPhone, Safari iOS, safe areas, tastatura mobilă sau ergonomia cu degetul. Recomandările tactile sunt bazate pe geometria DOM observată și necesită confirmare mobilă; capturile nu sunt simulări iPhone. Nu au fost evaluate carduri cu date populate, barele bugetelor active, sume lungi sau istorice populate. Nu se declară un audit complet de accesibilitate.

Nu s-au verificat calculele financiare, nu s-au modificat codul, versiunea sau proiectul iOS și nu s-a solicitat deployment. Raportul este consultativ și nu autorizează implementarea automată.

## Evaluare generală

Există o bază bună: valori aliniate, separare explicită între bani proprii și credit, navigare stabilă, controale de temă cu selecție vizibilă și o identitate cromatică recognoscibilă. În stările inspectate, nivelul premium este însă redus de contrastul unor acțiuni în dark, vocabularul tehnic și diferențele de tratament între ecrane. Prioritatea este claritatea și consistența, înaintea adăugării altor efecte decorative. Comparația cu categoria premium este o judecată de design, nu un benchmark live al altor aplicații.

P1 = afectează direct lizibilitatea sau înțelegerea; P2 = afectează eficiența și consistența; P3 = finisaj.

## Probleme prioritizate — 9

### 1. P1 — Acțiunile principale pierd contrastul în dark

- **Ecran:** Dashboard, tema dark, „Cheltuială” / „Venit”.
- **Observație:** textul și semnele sunt foarte închise pe fundaluri închise. Stilul calculat al elementelor text este RGB(16,22,25), pe RGB(101,75,98), respectiv RGB(41,92,100). Textul copiilor nu urmează culoarea albă a butonului părinte. Captura dark confirmă problema.
- **Impact:** acțiunile frecvente se citesc greu și pot părea inactive.
- **Recomandare:** atribuie explicit o culoare de text lizibilă pentru fiecare stare și temă, inclusiv iconurilor. Verifică perechile efective text/fundal pentru contrastul textului mic; evită rezolvarea doar prin creșterea saturației fundalului.
- **Dovadă:** `fa-review-dashboard-dark.jpg`.

### 2. P1 — Bugetele sunt explicate prin vocabular de implementare

- **Ecran:** Bugete și formular „Categorie de buget”.
- **Observație:** „Limită Primary”, „Primary window”, „Additional tracking windows”, „Custom”, „Home”, „Budget ID explicit”, „Fixed, Debt, Savings…” apar într-o interfață românească. Formularul afișează simultan perioada principală și toate ferestrele suplimentare, cu explicații lungi.
- **Impact:** utilizatorul trebuie să învețe structura internă înainte să poată stabili un buget; formularea transmite impresia de prototip.
- **Recomandare:** folosește „Perioada principală”, „Alte perioade urmărite”, „Personalizat”, „Acasă”. Mută regula tehnică despre ID și tipurile interne într-o explicație destinată utilizatorului. Arată întâi nume, sumă și perioadă, cu opțiunile avansate într-o secțiune extensibilă.
- **Dovadă:** `fa-review-budget-form.jpg`.

### 3. P2 — Controalele de detalii sunt mici și slab semnalizate

- **Ecran:** Dashboard, Autonomie și Spațiu.
- **Observație:** „Vezi calculul” este reprezentat vizual numai printr-un triunghi în colțul din dreapta jos. Dreptunghiurile DOM măsurate sunt 44 × 36 CSS px în viewportul inspectat. Pe Spațiu în light, triunghiul alb se distinge slab pe verdele deschis.
- **Impact:** explicațiile sunt ușor de ratat; înălțimea observată lasă puțină marjă pentru atingere.
- **Recomandare:** folosește o etichetă vizibilă „Calcul” cu chevron, contrast adaptat temei și o țintă de cel puțin 44 × 44 în implementarea mobilă. Confirmă separat măsurile și comportamentul pe iPhone; CSS px observate pe desktop nu certifică puncte iOS.
- **Dovadă:** capturile Dashboard light/dark.

### 4. P2 — Cardurile concurează între ele prin prea multe tratamente

- **Ecran:** Dashboard, ambele teme.
- **Observație:** Autonomie are fundal intens cu cercuri decorative; Spațiu are umplere verde, contur și punct; Cheltuit/Următorul venit au alte umpleri și borduri colorate; Buget are un contur mai pronunțat. Accentele nu exprimă o ierarhie unică.
- **Impact:** atenția se împarte între decorații, iar importanța informațiilor se deduce mai greu.
- **Recomandare:** păstrează două carduri distincte Autonomie/Spațiu, dar folosește o familie comună de raze, borduri și spațieri. Rezervă suprafața intensă unui singur nivel de importanță; păstrează distincția cheltuială/venit prin accente controlate. Redu cercurile și punctele fără semnificație. Umbrele suplimentare nu sunt necesare.
- **Dovadă:** capturile Dashboard light/dark.

### 5. P2 — Starea inițială pune prea mult conținut înaintea Bugetului

- **Ecran:** Dashboard fără date.
- **Observație:** bannerul de pornire, Autonomie, Spațiu, cele două carduri mici și acțiunile împing Bugetul spre marginea de jos chiar și la 936 px înălțime. Cardurile fără informații păstrează suprafețe generoase.
- **Impact:** prima utilizare cere multă scanare înainte de configurarea bugetului.
- **Recomandare:** compactează stările neconfigurate și explicația introductivă, păstrând ordinea cerută și cardurile separate. După configurare, reevaluează densitatea cu date sintetice. Nu extrapola această captură desktop la numărul exact de ecrane pe iPhone.
- **Dovadă:** `fa-review-dashboard-light.jpg`.

### 6. P2 — Finanțe nu are aceeași structură de pagină ca restul aplicației

- **Ecran:** Finanțe comparat cu Istoric, Bugete și Setări.
- **Observație:** Finanțe începe direct cu șase rânduri de accordion, fără titlu de pagină. Celelalte ecrane au titluri mari, introduceri și carduri. În Finanțe gol, aproape toată suprafața rămasă este nefolosită.
- **Impact:** orientarea și senzația de produs unitar slăbesc la schimbarea secțiunii.
- **Recomandare:** adaugă un titlu concis „Finanțe” și o structură comună de antet, margini și secțiuni. Păstrează lista compactă; nu transforma fiecare rând într-un card decorativ.
- **Dovadă:** inspecție vizuală directă în light/dark.

### 7. P2 — Istoricul acordă prioritate controalelor în locul conținutului

- **Ecran:** Istoric, light/dark, fără operațiuni.
- **Observație:** două rânduri de selecții, navigarea lunii, căutarea și două filtre ocupă majoritatea părții superioare. Selectarea a 10/20/50 rânduri este proeminentă chiar la zero rezultate; paginarea „1 / 1” rămâne afișată.
- **Impact:** utilizatorul procesează controale fără utilitate imediată și ajunge târziu la mesajul de stare.
- **Recomandare:** prioritizează luna și căutarea, grupează filtrele secundare într-un control „Filtre”, mută dimensiunea paginii lângă paginare. În starea goală, ascunde paginarea inutilă și oferă un mesaj central clar. Nu este necesară schimbarea mecanismului de istoric.
- **Dovadă:** `fa-review-history-light.jpg`.

### 8. P2 — Starea goală din Bugete trimite utilizatorul spre altă secțiune fără acțiune directă

- **Ecran:** Bugete.
- **Observație:** se afișează un card mare cu „Buget azi 0,00 RON / 0,00 RON” și „Sigur azi Indisponibil”, apoi textul „Adaugă primul buget din Finanțe”, fără un buton în acea stare.
- **Impact:** zero poate fi confundat cu un buget deja calculat; utilizatorul trebuie să găsească singur ruta de configurare.
- **Recomandare:** afișează o stare „Buget neconfigurat” și un buton „Configurează primul buget” către secțiunea existentă din Finanțe. Păstrează configurarea într-un singur loc; nu modifica formulele sau valorile contabile.
- **Dovadă:** inspecție vizuală directă a ecranului Bugete în light.

### 9. P3 — Ierarhia tipografică favorizează introducerile în detrimentul informației utile

- **Ecran:** Istoric, Bugete, Setări și Dashboard.
- **Observație:** titluri precum „Aceleași cheltuieli, văzute în ferestrele care contează.” sunt mult mai dominante decât valorile și explicațiile operative. În Dashboard, etichetele mici cu majuscule și textele „Detalii” coexistă cu suprafețe mari.
- **Impact:** tonul de prezentare ocupă atenția necesară consultării rapide a banilor.
- **Recomandare:** folosește titluri scurte de ecran și o scară tipografică comună: valoare principală, titlu de secțiune, text de bază, explicație. Redu rolul sloganurilor și folosește o dimensiune confortabilă pentru explicațiile frecvente; verifică mărirea textului pe iPhone înainte de validare.
- **Dovadă:** capturile Dashboard, Istoric și formular Buget.

## Referințe de design

- [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility): contrast în ambele teme, lizibilitate, mărirea textului și dimensiuni recomandate pentru controale.
- [Apple — UI Design Dos and Don’ts](https://developer.apple.com/design/tips/): potrivire pe ecran, ținte tactile de 44 × 44 pt, aliniere și spațiere.

Acestea sunt repere de recomandare; nu reprezintă o certificare HIG/WCAG. Capturile relevante sunt livrate în conversația Work în arhiva `Financial-Autonomy-Visual-Review.zip`, fără date financiare reale. Nu sunt incluse în repository ca linkuri relative inexistente.

## Stare finală

Review-ul disponibil este încheiat pentru desktop și stările descrise. Validarea vizuală iPhone și stările populate rămân explicit **neverificate**. Nicio recomandare nu a fost implementată.
