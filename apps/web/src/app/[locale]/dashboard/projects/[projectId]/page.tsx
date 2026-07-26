import { messages } from "@obrametrik/i18n";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { createMeasurement, createRoom } from "./actions";

export default async function ProjectDetail({ params }: {
  params: Promise<{ locale: keyof typeof messages; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  const t = messages[locale] ?? messages.ca;
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase.from("projects").select("id,name,description").eq("id", projectId).maybeSingle();
  if (!project) notFound();
  const { data: rooms } = await supabase.from("rooms").select("id,name,kind,length_m,width_m,height_m").eq("project_id", projectId).order("created_at");
  const roomIds = rooms?.map((room) => room.id) ?? [];
  const { data: surfaces } = roomIds.length
    ? await supabase.from("surfaces").select("id,room_id,name,kind,width_m,height_m,gross_area_m2").in("room_id", roomIds)
    : { data: [] };
  const surfaceIds = surfaces?.map((surface) => surface.id) ?? [];
  const { data: measurements } = surfaceIds.length
    ? await supabase.from("measurements").select("id,surface_id,label,operation,area_m2").in("surface_id", surfaceIds)
    : { data: [] };

  return <main className="dashboard-main">
    <header className="page-header"><div><span className="eyebrow">{t.projects}</span><h1>{project.name}</h1><p>{project.description}</p></div></header>
    <div className="measurement-layout">
      <section className="measurement-content">
        <div className="section-heading"><h2>{t.spaces}</h2></div>
        {!rooms?.length ? <div className="empty-state compact"><h2>{t.noRooms}</h2></div> : rooms.map((room) => (
          <article className="room-card" key={room.id}>
            <h2>{room.name}</h2>
            {room.length_m && room.width_m ? <div className="room-plan">
              <span>{t.planPreview}</span>
              <svg viewBox="0 0 320 190" role="img" aria-label={t.planPreview}>
                <rect x="35" y="25" width="250" height="130" rx="4" />
                <text x="160" y="85" textAnchor="middle">{room.length_m} × {room.width_m} m</text>
                <text x="160" y="108" textAnchor="middle">{room.name}</text>
              </svg>
            </div> : null}
            {(surfaces ?? []).filter((surface) => surface.room_id === room.id).map((surface) => {
              const adjustments = (measurements ?? []).filter((item) => item.surface_id === surface.id);
              const signed = adjustments.reduce((sum, item) => sum + (item.operation === "add" ? Number(item.area_m2) : -Number(item.area_m2)), 0);
              const invalid = Number(surface.width_m) > 100 || Number(surface.height_m) > 20;
              return <div className="surface-card" key={surface.id}>
                <div><span className="status-chip">{t[surface.kind as "wall" | "floor" | "ceiling" | "other"]}</span><h3>{({floor:t.floor,ceiling:t.ceiling,wall_north:t.wallNorth,wall_south:t.wallSouth,wall_east:t.wallEast,wall_west:t.wallWest} as Record<string,string>)[surface.name] ?? surface.name}</h3><p>{Number(surface.width_m) * 100} × {Number(surface.height_m) * 100} cm</p></div>
                {invalid ? <p role="alert" className="measurement-error">{t.invalidDimensions}</p> : <div className="area-summary"><span>{t.grossArea}<strong>{Number(surface.gross_area_m2).toFixed(2)} m²</strong></span><span>{t.netArea}<strong>{(Number(surface.gross_area_m2) + signed).toFixed(2)} m²</strong></span></div>}
                <form action={createMeasurement} className="inline-measurement">
                  <input name="locale" type="hidden" value={locale}/><input name="projectId" type="hidden" value={projectId}/><input name="surfaceId" type="hidden" value={surface.id}/>
                  <input name="label" placeholder={t.openingName} required/><input name="widthCm" placeholder={t.roomWidth} inputMode="decimal" required/><input name="heightCm" placeholder={t.roomHeight} inputMode="decimal" required/><button className="button" type="submit">{t.newOpening}</button>
                </form>
              </div>;
            })}
          </article>
        ))}
      </section>
      <form action={createRoom} className="new-project-card">
        <input name="locale" type="hidden" value={locale}/><input name="projectId" type="hidden" value={projectId}/>
        <span className="status-chip">{t.newSpace}</span><h2>{t.newSpace}</h2>
        <label>{t.roomName}<input name="name" required/></label>
        <label>{t.spaceType}<select name="kind"><option value="bathroom">{t.bathroom}</option><option value="kitchen">{t.kitchen}</option><option value="bedroom">{t.bedroom}</option><option value="living_room">{t.livingRoom}</option><option value="hallway">{t.hallway}</option><option value="other">{t.other}</option></select></label>
        <label>{t.roomLength}<input name="lengthCm" inputMode="numeric" placeholder="300" required/></label>
        <label>{t.roomWidth}<input name="widthCm" inputMode="numeric" placeholder="240" required/></label>
        <label>{t.roomHeight}<input name="heightCm" inputMode="numeric" placeholder="250" required/></label>
        <button className="button" type="submit">{t.newSpace} →</button>
      </form>
    </div>
  </main>;
}
