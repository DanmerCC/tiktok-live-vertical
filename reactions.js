/* ============================================================
   BUS DE EVENTOS + MANEJADOR DE REACCIONES
   ------------------------------------------------------------
   Cualquier parte del sistema puede emitir eventos al bus y
   las reacciones registradas responden a ellos.

   Uso:
     EventBus.emit('reaction', { type: 'emoji', count: 3 });
     Reactions.register('miReaccion', (data) => { ... });
   ============================================================ */
(function () {
  'use strict';

  const listeners = {};
  const reactions = {};

  // ---- BUS DE EVENTOS (pub/sub) ----
  window.EventBus = {
    on(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
      return () => this.off(type, fn);
    },
    off(type, fn) {
      const arr = listeners[type];
      if (!arr) return;
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    },
    emit(type, data) {
      (listeners[type] || []).forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error('[EventBus] error en handler de "' + type + '":', e);
        }
      });
    },
  };

  // ---- MANEJADOR DE REACCIONES ----
  window.Reactions = {
    register(name, fn) {
      reactions[name] = fn;
    },
    unregister(name) {
      delete reactions[name];
    },
    has(name) {
      return Object.prototype.hasOwnProperty.call(reactions, name);
    },
    trigger(name, data) {
      const fn = reactions[name];
      if (!fn) return false;
      try {
        fn(data || {});
      } catch (e) {
        console.error('[Reactions] error en "' + name + '":', e);
      }
      return true;
    },
    names() {
      return Object.keys(reactions);
    },
  };

  // ---- PUENTE: eventos del tipo 'reaction' disparan reacciones ----
  window.EventBus.on('reaction', (data) => {
    if (data && data.type) {
      window.Reactions.trigger(data.type, data);
    }
  });
})();
