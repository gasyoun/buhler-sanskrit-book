import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import useBaseUrl from '@docusaurus/useBaseUrl';

import topicIndexTsv from '../dictionary/topic_index.tsv';

interface TopicEntry {
  id: string;
  lesson: string;
  anchor: string;
  topic: string;
}

function parseTopicsTsv(tsvContent: string): TopicEntry[] {
  const result = Papa.parse(tsvContent, {
    delimiter: '\t',
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });
  return result.data as TopicEntry[];
}

const TopicIndex: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const docsBase = useBaseUrl('/docs');

  const allEntries = useMemo(() => parseTopicsTsv(topicIndexTsv), []);

  const lessons = useMemo(() => {
    const set = new Set(allEntries.map((e) => e.lesson));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [allEntries]);

  const filtered = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesLesson = !selectedLesson || entry.lesson === selectedLesson;
      const matchesText =
        !filter || entry.topic.toLowerCase().includes(filter.toLowerCase());
      return matchesLesson && matchesText;
    });
  }, [allEntries, filter, selectedLesson]);

  const grouped = useMemo(() => {
    const map = new Map<string, TopicEntry[]>();
    for (const entry of filtered) {
      const list = map.get(entry.lesson) || [];
      list.push(entry);
      map.set(entry.lesson, list);
    }
    return Array.from(map.entries()).sort(
      (a, b) => Number(a[0]) - Number(b[0]),
    );
  }, [filtered]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Поиск по теме..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid var(--ifm-color-emphasis-300)',
            background: 'var(--ifm-background-color)',
            color: 'var(--ifm-font-color-base)',
            flex: '1',
            minWidth: '200px',
          }}
        />
        <select
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid var(--ifm-color-emphasis-300)',
            background: 'var(--ifm-background-color)',
            color: 'var(--ifm-font-color-base)',
          }}
        >
          <option value="">Все уроки</option>
          {lessons.map((l) => (
            <option key={l} value={l}>
              Урок {l}
            </option>
          ))}
        </select>
      </div>

      {grouped.length === 0 && (
        <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>
          Ничего не найдено.
        </p>
      )}

      {grouped.map(([lesson, entries]) => (
        <div key={lesson} style={{ marginBottom: '1.5rem' }}>
          <h3>
            <a
              href={`${docsBase}/lesson${lesson}`}
              style={{ color: 'var(--ifm-color-primary)' }}
            >
              Урок {lesson}
            </a>
          </h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {entries.map((entry) => (
              <li key={entry.id} style={{ marginBottom: '0.4rem' }}>
                <a
                  href={`${docsBase}/lesson${entry.lesson}#${entry.anchor}`}
                  style={{
                    color: 'var(--ifm-font-color-base)',
                    textDecoration: 'none',
                  }}
                >
                  {entry.topic}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TopicIndex;
