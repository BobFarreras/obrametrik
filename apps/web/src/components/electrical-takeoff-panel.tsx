import type { Database } from "@obrametrik/database";
import type { messages } from "@obrametrik/i18n";
import {
  addTakeoffLineToShoppingList,
  toggleShoppingListItem,
} from "../app/[locale]/dashboard/projects/[projectId]/actions";

type Catalog = (typeof messages)[keyof typeof messages];
type TakeoffRun = Database["public"]["Tables"]["takeoff_runs"]["Row"];
type TakeoffLine = Database["public"]["Tables"]["takeoff_lines"]["Row"];
type ShoppingItem = Database["public"]["Tables"]["shopping_list_items"]["Row"];

function quantity(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

function priceRange(line: TakeoffLine, locale: string, pending: string): string {
  if (line.price_low_cents === null || line.price_high_cents === null) return pending;
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  return `${formatter.format(line.price_low_cents / 100)}–${formatter.format(line.price_high_cents / 100)}`;
}

function categoryLabel(categoryId: string, t: Catalog): string {
  const labels: Record<string, string> = {
    "electrical.device.light": t.materialLightPoint,
    "electrical.device.switch": t.materialSwitch,
    "electrical.device.socket": t.materialSocket,
    "electrical.box.flush": t.materialFlushBox,
    "electrical.frame": t.materialFrame,
    "electrical.connector": t.materialConnector,
    "tool.insulated_screwdriver": t.toolInsulatedScrewdriver,
    "tool.wire_stripper": t.toolWireStripper,
    "tool.voltage_tester": t.toolVoltageTester,
  };
  return labels[categoryId] ?? categoryId;
}

function variantLabel(specification: TakeoffLine["specification"], t: Catalog): string | null {
  if (!specification || Array.isArray(specification) || typeof specification !== "object")
    return null;
  const variant = typeof specification.variant === "string" ? specification.variant : null;
  if (!variant) return null;
  const labels: Record<string, string> = {
    single: t.variantSingle,
    double: t.variantDouble,
    usb: t.variantUsb,
    dimmer: t.variantDimmer,
    two_way: t.variantTwoWay,
    ceiling: t.variantCeiling,
    wall: t.variantWall,
    recessed: t.variantRecessed,
    pendant: t.variantPendant,
  };
  return labels[variant] ?? variant;
}

function MaterialIllustration({ categoryId }: { categoryId: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };
  if (categoryId.includes("socket"))
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect {...common} x="9" y="9" width="30" height="30" rx="9" />
        <circle {...common} cx="18" cy="23" r="2" />
        <circle {...common} cx="30" cy="23" r="2" />
        <path {...common} d="M24 28v5" />
      </svg>
    );
  if (categoryId.includes("switch"))
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect {...common} x="9" y="9" width="30" height="30" rx="9" />
        <path {...common} d="M17 27h14M18 20h12" />
      </svg>
    );
  if (categoryId.includes("light"))
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          {...common}
          d="M17 29c-3-2-5-6-5-10a12 12 0 0 1 24 0c0 4-2 8-5 10l-2 3H19zM20 38h8M24 3V0M7 9 3 6M41 9l4-3"
        />
      </svg>
    );
  if (categoryId.includes("box"))
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle {...common} cx="24" cy="24" r="15" />
        <path {...common} d="M9 20h7M32 20h7M18 30h12" />
      </svg>
    );
  if (categoryId.includes("frame"))
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect {...common} x="7" y="11" width="34" height="26" rx="6" />
        <rect {...common} x="15" y="16" width="18" height="16" rx="4" />
      </svg>
    );
  if (categoryId.includes("connector"))
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect {...common} x="9" y="17" width="30" height="14" rx="4" />
        <path {...common} d="M15 17v14M24 17v14M33 17v14M4 24h5M39 24h5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path {...common} d="m13 35 19-19M28 12l8-3-3 8M10 38l-2 2M16 34l-6-6M29 28l9 9" />
    </svg>
  );
}

function TakeoffCard({
  line,
  locale,
  projectId,
  t,
}: {
  line: TakeoffLine;
  locale: keyof typeof messages;
  projectId: string;
  t: Catalog;
}) {
  const sources = line.source_entity_ids.length;
  const variant = variantLabel(line.specification, t);
  return (
    <article className="material-card">
      <div className="material-card-visual">
        <MaterialIllustration categoryId={line.category_id} />
      </div>
      <div className="material-card-main">
        <div className="material-card-heading">
          <div>
            <strong>{categoryLabel(line.category_id, t)}</strong>
            {variant ? <span>{variant}</span> : null}
          </div>
          <b>
            {quantity(line.purchase_quantity, locale)} {t.unitsShort}
          </b>
        </div>
        <p>{t.calculatedFromPlanObjects.replace("{count}", String(sources))}</p>
        <div className="material-card-meta">
          <span>{priceRange(line, locale, t.pricePending)}</span>
          <span>{t.confirmedFromPlan}</span>
        </div>
        <details className="material-explanation">
          <summary>{t.whyNeeded}</summary>
          <p>{t.recipeExplanation.replace("{count}", String(sources))}</p>
          <small>
            {t.technicalRule}: {line.calculation_rule_id}
          </small>
        </details>
        <form action={addTakeoffLineToShoppingList}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="lineId" value={line.id} />
          <button className="button material-add-button" type="submit">
            {t.addToShoppingList}
          </button>
        </form>
      </div>
    </article>
  );
}

export function ElectricalTakeoffPanel({
  locale,
  projectId,
  messages: t,
  latestRun,
  lines,
  shoppingItems,
}: {
  locale: keyof typeof messages;
  projectId: string;
  messages: Catalog;
  latestRun: TakeoffRun | null;
  lines: readonly TakeoffLine[];
  shoppingItems: readonly ShoppingItem[];
}) {
  const materials = lines.filter((line) => !line.category_id.startsWith("tool."));
  const tools = lines.filter((line) => line.category_id.startsWith("tool."));

  return (
    <details className="takeoff-drawer" id="materials-shopping-drawer">
      <summary>{t.closeMaterials}</summary>
      <div className="takeoff-drawer-content" tabIndex={-1}>
        <header className="materials-header">
          <span className="eyebrow">{t.electricalTakeoff}</span>
          <h2>{t.materialsAndShopping}</h2>
          <p>{t.automaticMaterialsHelp}</p>
          <span className="materials-auto-status">{t.automaticOnSave}</span>
        </header>

        {!latestRun ? (
          <section className="takeoff-empty">
            <MaterialIllustration categoryId="electrical.device.socket" />
            <h3>{t.noTakeoffYet}</h3>
            <p>{t.savePlanToCalculate}</p>
          </section>
        ) : lines.length === 0 ? (
          <section className="takeoff-empty">
            <MaterialIllustration categoryId="electrical.device.light" />
            <h3>{t.takeoffInsufficientPlan}</h3>
            <p>{t.takeoffBlocked}</p>
          </section>
        ) : (
          <>
            <section className="takeoff-route-notice">
              <strong>{t.cablesPendingTitle}</strong>
              <p>{t.routesPending}</p>
            </section>

            <section className="takeoff-group" aria-labelledby="materials-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{t.buyForInstallation}</span>
                  <h3 id="materials-title">{t.materials}</h3>
                </div>
                <span className="takeoff-count">{materials.length}</span>
              </div>
              <div className="material-grid">
                {materials.map((line) => (
                  <TakeoffCard
                    key={line.id}
                    line={line}
                    locale={locale}
                    projectId={projectId}
                    t={t}
                  />
                ))}
              </div>
            </section>

            <section className="takeoff-group tools-group" aria-labelledby="tools-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{t.reusableNotConsumable}</span>
                  <h3 id="tools-title">{t.tools}</h3>
                </div>
                <span className="takeoff-count">{tools.length}</span>
              </div>
              <div className="material-grid">
                {tools.map((line) => (
                  <TakeoffCard
                    key={line.id}
                    line={line}
                    locale={locale}
                    projectId={projectId}
                    t={t}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <section className="takeoff-group shopping-group" aria-labelledby="shopping-list-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.purchaseTracking}</span>
              <h3 id="shopping-list-title">{t.shoppingList}</h3>
            </div>
          </div>
          {shoppingItems.length === 0 ? (
            <p>{t.emptyShoppingList}</p>
          ) : (
            <ul className="shopping-list">
              {shoppingItems.map((item) => (
                <li key={item.id}>
                  <div className="shopping-item-visual">
                    <MaterialIllustration categoryId={item.category_id} />
                  </div>
                  <span>
                    <strong>{categoryLabel(item.category_id, t)}</strong>
                    <small>
                      {quantity(item.quantity, locale)} {t.unitsShort}
                    </small>
                  </span>
                  <form action={toggleShoppingListItem}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="checked" value={String(!item.checked)} />
                    <button type="submit" aria-pressed={item.checked}>
                      {item.checked ? t.purchased : t.markPurchased}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </details>
  );
}
