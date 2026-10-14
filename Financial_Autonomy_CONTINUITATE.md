# Financial Autonomy — continuitate și mod de lucru

Actualizat: 14 octombrie 2026. **Citește acest fișier la începutul fiecărui chat nou** înainte de a modifica aplicația.

## Ce dorește utilizatorul

Aplică modificările **direct în aplicația existentă**, publică o versiune nouă în GitHub, actualizează preview-ul, iar utilizatorul testează și oferă feedback. Nu te limita la instrucțiuni, propuneri, mockupuri sau module izolate. Nu solicita reconfirmarea unei cerințe deja clare. Explică precis ce ai schimbat și ce ai verificat efectiv. Nu afirma că deploymentul a reușit dacă nu este confirmat.

## Repository și preview

- GitHub: https://github.com/nikopol000/financial-autonomy-preview (branch `main`)
- Preview: https://financial-autonomy-preview.vercel.app/
- Aplicație Expo / React Native Web, momentan servită prin bundle JS minificat din `_expo/static/js/web/`, referit de `index.html`.
- Ultima versiune creată în conversația din 14 octombrie: **v18.20**.
- Bundle: `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js`.
- Commit de actualizare a indexului: `ee99934f2e039b4f3abb186d4a83c25b1d217889`.
- La ultimul control, deploymentul Vercel **nu era confirmat**; verifică din nou.

## Fluxul concret de modificare folosit în conversațiile recente

1. Citește cerința și **inspectează codul actual** și structura datelor înainte de modificare.
2. Folosește conectorul GitHub prin `functions.exec`. Pentru citire:
   `await tools.mcp__GitHub__fetch_file({repository_full_name:"nikopol000/financial-autonomy-preview",path:"..."})`.
   Rezultatul oferă `result.content` și `result.sha`.
3. Modifică punctual codul existent. În sesiunile recente s-a creat **un bundle nou cu nume și versiune unice**, păstrând precedentul pentru rollback.
4. **Verifică obligatoriu sintaxa** înainte de commit: `new Function(modifiedSource)` a fost folosit în mediul `functions.exec`. Ideal, verifică și funcțional în browser/teste. v18.15 a introdus o paranteză greșită și a provocat o pagină albă.
5. Creează bundle-ul prin `tools.mcp__GitHub__create_file({repository_full_name,path,content,message})`.
6. Citește `index.html`, schimbă referința bundle-ului și versiunea; salvează prin `tools.mcp__GitHub__update_file({repository_full_name,path:"index.html",sha,content,message})`.
7. Verifică `tools.mcp__GitHub__get_commit_combined_status({repo_full_name,commit_sha})`. `statuses: []` sau `pending` **nu confirmă deploymentul**.
8. Comunică versiunea, modificările concrete, testele efectuate, starea reală a deploymentului și linkul preview.
9. La următoarea cerință, continuă de la **bundle-ul referit în indexul curent**, nu de la o copie veche.

**Atenție:** modificarea bundle-ului minificat este fragilă și este doar metoda pragmatică recentă. Dacă există surse originale, preferă modificarea surselor, build și teste, păstrând aceeași livrare directă în preview.

## Istoric: modificările v18.15–v18.20

- **v18.15:** căutare/filtre și corecturi; eroare de sintaxă, pagină albă.
- **v18.16:** corectarea sintaxei.
- **v18.17:** filtre de cont și tip compacte, selectabile, nu etichete lungi afișate simultan.
- **v18.18:** comutare `Operațiuni / Corecturi`, paginare 10/20/50, anterior/următor, interval și total.
- **v18.19:** corecturi afișate în rânduri cu aspect apropiat de operațiuni; nume, dată, sumă, extindere detalii.
- **v18.20:** când o operațiune este deschisă din Istoric, buton `‹ Înapoi la Istoric`; după salvare revine la Istoric.

UX dorit: aplicație financiară modernă, listă ușor de parcurs, filtre în câmpuri selectabile, paginare standard, prezentare coerentă între operațiuni și corecturi, fără aglomerare vizuală.

## Date și reconciliere — precauții critice

- Aplicația este **local-only**, fără backend, conectare bancară, conturi de utilizator sau telemetrie. Datele din preview rămân local în browser. **Nu șterge/resetta storage-ul utilizatorului**.
- Soldurile reale verificate sunt autoritare în `Banii mei`. Explicațiile discrepanțelor justifică diferența, dar nu trebuie să schimbe artificial soldul real.
- `Neexplicat` trebuie comparat cu soldul calculat din soldul inițial și **toate tranzacțiile istorice**, nu doar cele de după ultima verificare. Corecturile istorice trebuie să poată influența reconcilierea; păstrează auditul.
- **Atenție la v18.14:** s-a schimbat formula `difference`, dar `expected` poate utiliza altă bază; nu presupune că logica este complet validată.
- Exemplu de depanare: transfer SALT → ING 3700 RON și ulterior invers, sold SALT introdus eronat ca 0, apoi corectat; discrepanță rămasă 6,90 RON. Nu inventa tranzacții ca să forțezi potrivirea.
- **Nu publica date financiare personale**, fișiere de diagnostic cu solduri sau informații sensibile în repository.

## Cum continui într-un chat nou

1. Citește **acest fișier din GitHub**.
2. Citește `index.html` și bundle-ul efectiv referit.
3. Verifică statusul ultimului deployment.
4. Inspectează zona de cod cerută, implementează modificarea, verifică sintaxa/testele, creează versiune nouă și actualizează preview-ul.
5. Utilizatorul testează; răspunde direct la observații și repară fără să pretinzi că ai verificat în browser dacă nu ai făcut-o.

Acest document din GitHub este reperul de continuitate verificabil; memoria conversațională poate fi incompletă.
