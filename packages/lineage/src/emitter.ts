import { Lineage } from '@translation/core/src/types';

/**
 * Asynchronously emit a lineage event.  In a real deployment this
 * would publish to a Kafka topic or send to a tracing backend.  Here
 * we simply log it to the console.
 */
export async function emitLineage(l: Lineage) {
  console.debug('[lineage]', JSON.stringify(l));
}