import { configuredPrice } from "../domain/training";
import { useState } from "react";
import { enterpriseWorkflow } from "../domain/workflow";
import { calculate, saveProcessRecord, type Mission } from "../domain/mission";
export function ProcessRecordForm({
  mission,
  disabled,
  onSave,
}: {
  mission: Mission;
  disabled: boolean;
  onSave: (mission: Mission) => Promise<boolean>;
}) {
  const stage = enterpriseWorkflow[mission.step];
  const stored = mission.processRecords?.[String(mission.step)];
  const [values, setValues] = useState<Record<string, string>>(
    () =>
      stored?.values ?? {
        ...(mission.step === 7
          ? { pricingMethod: "Preço definido", pricingRate: "10" }
          : {}),
        ...Object.fromEntries(
          stage.fields
            .filter((field) => field.inputKey)
            .map((field) => [
              field.key,
              String(mission.input[field.inputKey!]),
            ]),
        ),
      },
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const calc = calculate(mission.input, mission.occurrences);
  const dirty = JSON.stringify(values) !== JSON.stringify(stored?.values ?? {});
  return (
    <form
      className="process-record"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setSaved(false);
        try {
          if (await onSave(saveProcessRecord(mission, values))) setSaved(true);
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível salvar o registro.",
          );
        }
      }}
    >
      <span className="eyebrow">{stage.department}</span>
      <h3>Registro da etapa</h3>
      {(mission.step === 7 || mission.step === 9) && (
        <p>
          Custo calculado:{" "}
          {calc.total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          · Margem atual: {calc.margin.toFixed(1)}%. O preço salvo atualiza o
          frete da missão.
        </p>
      )}
      {mission.step === 14 && (
        <p>
          Peso declarado: {mission.processRecords?.["3"]?.values.weight}{" "}
          toneladas. A capacidade precisa comportar essa carga.
        </p>
      )}
      {mission.step === 7 &&
        values.pricingMethod &&
        values.pricingMethod !== "Preço definido" && (
          <div className="pricing-calculator">
            <p>
              {values.pricingMethod === "Margem sobre a receita"
                ? "Preço = custo ÷ (1 − percentual). A margem é calculada sobre a receita."
                : "Preço = custo × (1 + percentual). O acréscimo sobre custo difere da margem sobre receita."}
            </p>
            <button
              type="button"
              className="secondary"
              disabled={disabled}
              onClick={() => {
                try {
                  const price = configuredPrice(
                    calc.total,
                    values.pricingMethod,
                    Number(values.pricingRate),
                  );
                  setValues({ ...values, freight: String(price) });
                  setSaved(false);
                  setError("");
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Revise o percentual.",
                  );
                }
              }}
            >
              Calcular e aplicar preço
            </button>
          </div>
        )}
      <fieldset disabled={disabled}>
        {stage.fields.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.options ? (
              <select
                required={!field.optional}
                value={values[field.key] ?? ""}
                onChange={(e) => {
                  setValues({ ...values, [field.key]: e.target.value });
                  setSaved(false);
                }}
              >
                <option value="">Selecione</option>
                {field.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                required={!field.optional}
                type={field.type === "number" ? "number" : "text"}
                min={field.min}
                max={field.max}
                step="any"
                maxLength={field.inputKey ? 100 : 500}
                value={values[field.key] ?? ""}
                onChange={(e) => {
                  setValues({ ...values, [field.key]: e.target.value });
                  setSaved(false);
                }}
              />
            )}
          </label>
        ))}
        <button className="secondary" type="submit">
          Salvar registro da etapa
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <p role="status">
        {saved || (stored && !dirty)
          ? "Registro salvo na missão."
          : "Preencha e salve o registro antes de concluir a etapa."}
      </p>
    </form>
  );
}
