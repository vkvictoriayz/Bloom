import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Icone from "../../components/Icone";
import Avatar from "../../components/comunidade/Avatar";
import {
  CartaoTalento,
  Carregando,
  ErroAoCarregar,
} from "../../components/empresa/Estados";
import { useCarregar } from "../../components/empresa/useCarregar";
import { IlustracaoConexoes } from "../../components/ilustracoes/Ilustracoes";
import Botao from "../../components/ui/Botao";
import { Selecao, estiloControle } from "../../components/ui/Campo";
import { Vazio, VazioDescricao, VazioTitulo } from "../../components/ui/Vazio";
import { listarTalentos } from "../../services/empresa";
import { cn } from "../../lib/cn";

const VISOES = [
  { id: "", rotulo: "Todas", icone: "grupo" },
  { id: "areas", rotulo: "Por área", icone: "estrela" },
];

function PorArea({ talentos }) {
  const mapa = new Map();
  talentos.forEach((t) => {
    const chave = t.area || "Área não informada";
    mapa.set(chave, [...(mapa.get(chave) ?? []), t]);
  });
  const grupos = [...mapa.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "pt-BR"),
  );
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {grupos.map(([area, pessoas]) => (
        <section
          key={area}
          className="cartao overflow-hidden"
          aria-label={area}
        >
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blush to-papel px-5 py-4">
            <h2 className="font-display text-xl text-vinho-escuro">{area}</h2>
            <span className="rounded-full bg-branco px-2.5 py-0.5 text-xs font-semibold text-vinho">
              {pessoas.length} {pessoas.length === 1 ? "perfil" : "perfis"}
            </span>
          </div>
          <ul className="divide-y divide-linha px-5">
            {pessoas.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/empresa/talentos/${p.id}`}
                  className="flex items-center gap-3 py-3 hover:text-vinho"
                >
                  <Avatar nome={p.nome} foto={p.foto} tamanho="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {p.nome}
                    </span>
                    <span className="block truncate text-xs text-suave">
                      {p.interesses.join(" · ") || "Interesses não informados"}
                    </span>
                  </span>
                  <Icone
                    nome="seta"
                    tamanho={16}
                    className="shrink-0 text-suave"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ExplorarTalentos() {
  const [parametros, setParametros] = useSearchParams();
  const busca = parametros.get("q") ?? "";
  const area = parametros.get("area") ?? "";
  const visao = parametros.get("visao") === "areas" ? "areas" : "";
  const [termo, setTermo] = useState(busca);
  const [buscaAnterior, setBuscaAnterior] = useState(busca);
  if (buscaAnterior !== busca) {
    setBuscaAnterior(busca);
    setTermo(busca);
  }
  const r = useCarregar(() => listarTalentos({ busca, area }), [busca, area]);
  const todas = useCarregar(() => listarTalentos());
  const areas =
    todas.tipo === "pronto"
      ? [
          ...new Set(todas.dados.talentos.map((t) => t.area).filter(Boolean)),
        ].sort((a, b) => a.localeCompare(b, "pt-BR"))
      : [];

  function definir(chave, valor) {
    const p = new URLSearchParams(parametros);
    if (valor) p.set(chave, valor);
    else p.delete(chave);
    setParametros(p, { replace: true });
  }

  useEffect(() => {
    document.title = "Explorar talentos · BLOOM";
  }, []);

  return (
    <>
      <header className="border-b border-linha pb-6">
        <h1 className="font-display text-4xl text-tinta sm:text-5xl">Explorar talentos</h1>
        <p className="mt-2 max-w-xl text-tinta-2">Conheça profissionais da comunidade Bloom pelo que elas compartilham publicamente.</p>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          definir("q", termo.trim());
        }}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Icone
            nome="busca"
            tamanho={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-suave"
          />
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Nome, área ou competência"
            aria-label="Buscar talentos"
            className={cn(estiloControle, "h-12 pl-12 text-base")}
          />
        </div>
        <Selecao
          aria-label="Filtrar por área"
          value={area}
          onChange={(e) => definir("area", e.target.value)}
          className="h-12 sm:w-56"
        >
          <option value="">Todas as áreas</option>
          {areas.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Selecao>
        <Botao type="submit" className="h-12">
          Buscar
        </Botao>
      </form>
      </header>

      <div
        role="tablist"
        aria-label="Modo de exibição"
        className="mt-5 inline-flex rounded-full border border-linha bg-branco p-1"
      >
        {VISOES.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={visao === v.id}
            onClick={() => definir("visao", v.id)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
              visao === v.id
                ? "bg-vinho text-branco"
                : "text-tinta-2 hover:bg-papel-2",
            )}
          >
            <Icone nome={v.icone} tamanho={16} /> {v.rotulo}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {r.tipo === "carregando" && <Carregando quantidade={3} altura="h-40" />}
        {r.tipo === "erro" && (
          <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />
        )}
        {r.tipo === "pronto" &&
          (r.dados.talentos.length === 0 ? (
            <Vazio className="bg-branco">
              <IlustracaoConexoes className="max-w-[220px]" />
              <VazioTitulo>Nenhum talento encontrado</VazioTitulo>
              <VazioDescricao>
                {busca || area
                  ? "Tente outro termo ou remova o filtro de área."
                  : "Ainda não há integrantes cadastradas."}
              </VazioDescricao>
            </Vazio>
          ) : (
            <>
              <p className="mb-3 text-sm text-tinta-2" aria-live="polite">
                <strong className="text-tinta">
                  {r.dados.talentos.length}
                </strong>{" "}
                {r.dados.talentos.length === 1
                  ? "profissional"
                  : "profissionais"}
              </p>
              {visao === "areas" ? (
                <PorArea talentos={r.dados.talentos} />
              ) : (
                <ul className="animar-lista grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
                  {r.dados.talentos.map((t) => (
                    <li key={t.id}>
                      <CartaoTalento
                        talento={t}
                        acao={
                          <Botao
                            as={Link}
                            to={`/empresa/talentos/${t.id}`}
                            variante="secundario"
                            tamanho="sm"
                            className="w-full"
                          >
                            Ver perfil
                          </Botao>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ))}
      </div>
    </>
  );
}

export default ExplorarTalentos;
