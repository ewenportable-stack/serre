import { useEffect, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import {
  ALL_WEEKDAYS,
  WEEKDAY_LABELS,
  useIsActuatorOn,
  useLiveStore,
  type ActuatorSchedule,
  type Weekday,
} from "../../store/liveStore";
import { getDeviceCatalogEntry } from "../../constants/deviceCatalog";
import type { DeviceNode } from "../../types/hypervision";

interface ActuatorDetailModalProps {
  node: DeviceNode;
  onClose: () => void;
}

const TIMER_PRESETS = [5, 10, 15, 30, 60];
/** Référence stable pour éviter qu'un sélecteur Zustand ne recrée un tableau vide à chaque rendu (boucle infinie). */
const EMPTY_SCHEDULES: ActuatorSchedule[] = [];

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ActuatorDetailModal({ node, onClose }: ActuatorDetailModalProps) {
  const entry = getDeviceCatalogEntry(node.type);
  const zones = useEditorStore((s) => s.zones);
  const zone = zones.find((z) => z.id === node.zoneId);

  const isOn = useIsActuatorOn(node.id);
  const manualOn = useLiveStore((s) => s.actuatorManualOn[node.id] ?? false);
  const timerEndsAt = useLiveStore((s) => s.actuatorTimerEndsAt[node.id]);
  const scheduleActive = useLiveStore((s) => s.actuatorScheduleActive[node.id] ?? false);
  const schedules = useLiveStore((s) => s.actuatorSchedules[node.id] ?? EMPTY_SCHEDULES);

  const setActuatorManual = useLiveStore((s) => s.setActuatorManual);
  const startActuatorTimer = useLiveStore((s) => s.startActuatorTimer);
  const cancelActuatorTimer = useLiveStore((s) => s.cancelActuatorTimer);
  const addSchedule = useLiveStore((s) => s.addSchedule);
  const updateSchedule = useLiveStore((s) => s.updateSchedule);
  const removeSchedule = useLiveStore((s) => s.removeSchedule);

  const [customMinutes, setCustomMinutes] = useState("15");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const remainingMs = timerEndsAt !== undefined ? Math.max(0, timerEndsAt - now) : 0;

  const reason = manualOn ? "Activé manuellement" : timerEndsAt !== undefined ? "Minuteur en cours" : scheduleActive ? "Programmation active" : null;

  const toggleDay = (schedule: (typeof schedules)[number], day: Weekday) => {
    const days = schedule.days.includes(day) ? schedule.days.filter((d) => d !== day) : [...schedule.days, day];
    updateSchedule(node.id, schedule.id, { days });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{node.label}</h3>
            <p className="inspector-subtitle">
              {entry.label}
              {zone ? ` · ${zone.name}` : ""}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <div className="actuator-status-row">
          <button
            type="button"
            className={`big-toggle ${manualOn ? "on" : "off"}`}
            onClick={() => setActuatorManual(node.id, !manualOn)}
          >
            {manualOn ? "MARCHE" : "ARRÊT"}
          </button>
          <div className="actuator-status-text">
            <strong className={isOn ? "status-on" : "status-off"}>{isOn ? "Actif" : "Inactif"}</strong>
            {reason && <span>{reason}</span>}
          </div>
        </div>

        <hr />
        <h4>Minuteur</h4>
        {timerEndsAt !== undefined ? (
          <div className="timer-active">
            <span>
              Arrêt automatique dans <strong>{formatRemaining(remainingMs)}</strong>
            </span>
            <button type="button" className="secondary-button" onClick={() => cancelActuatorTimer(node.id)}>
              Annuler le minuteur
            </button>
          </div>
        ) : (
          <div className="timer-control">
            <div className="timer-presets">
              {TIMER_PRESETS.map((m) => (
                <button key={m} type="button" onClick={() => startActuatorTimer(node.id, m)}>
                  {m} min
                </button>
              ))}
            </div>
            <div className="timer-custom">
              <input
                type="number"
                min={1}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
              />
              <span>min</span>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const minutes = Number(customMinutes);
                  if (minutes > 0) startActuatorTimer(node.id, minutes);
                }}
              >
                Démarrer
              </button>
            </div>
          </div>
        )}

        <hr />
        <h4>Programmation</h4>
        <div className="schedule-list">
          {schedules.length === 0 && <p className="inspector-shortcut-hint">Aucun créneau programmé.</p>}
          {schedules.map((schedule) => (
            <div key={schedule.id} className="schedule-row">
              <div className="schedule-row-main">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={(e) => updateSchedule(node.id, schedule.id, { enabled: e.target.checked })}
                  title="Activer ce créneau"
                />
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => updateSchedule(node.id, schedule.id, { startTime: e.target.value })}
                />
                <span>pendant</span>
                <input
                  type="number"
                  min={1}
                  className="schedule-duration"
                  value={schedule.durationMinutes}
                  onChange={(e) => updateSchedule(node.id, schedule.id, { durationMinutes: Math.max(1, Number(e.target.value)) })}
                />
                <span>min</span>
                <button type="button" className="schedule-delete" onClick={() => removeSchedule(node.id, schedule.id)} aria-label="Supprimer">
                  ×
                </button>
              </div>
              <div className="weekday-picker">
                {ALL_WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={schedule.days.includes(day) ? "active" : ""}
                    onClick={() => toggleDay(schedule, day)}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            addSchedule(node.id, { startTime: "08:00", durationMinutes: 15, days: [...ALL_WEEKDAYS], enabled: true })
          }
        >
          + Ajouter un créneau
        </button>

        <p className="modal-note">
          Pilotage simulé côté navigateur — le backend MQTT n'est pas encore branché, aucune commande n'est envoyée à un
          appareil réel.
        </p>
      </div>
    </div>
  );
}
