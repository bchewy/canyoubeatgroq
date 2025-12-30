-- Mock history data for testing
-- Generated with random scores and timestamps over the past 7 days

insert into public.history (user_handle, game_type, score_value, created_at) values
  ('aa', 'puzzle', 0.36, now() - interval '6 hours'),
  ('ebleb', 'puzzle', 0.55, now() - interval '12 hours'),
  ('tem', 'oneword', 0.70, now() - interval '1 day'),
  ('hi', 'puzzle', 1.28, now() - interval '1 day 3 hours'),
  ('smolFry', 'puzzle', 1.15, now() - interval '1 day 8 hours'),
  ('TomZacharski', 'puzzle', 0.50, now() - interval '1 day 12 hours'),
  ('ko', 'puzzle', 0.08, now() - interval '2 days'),
  ('Hhh', 'puzzle', 1.94, now() - interval '2 days 4 hours'),
  ('ttt', 'oneword', 1.49, now() - interval '2 days 8 hours'),
  ('z', 'puzzle', 1.84, now() - interval '2 days 18 hours'),
  ('cosmo', 'oneword', 0.38, now() - interval '3 days'),
  ('anon', 'oneword', 0.57, now() - interval '3 days 6 hours'),
  ('x0', 'oneword', 0.70, now() - interval '3 days 12 hours'),
  ('jlo', 'oneword', 0.80, now() - interval '3 days 18 hours'),
  ('yo', 'oneword', 0.82, now() - interval '4 days'),
  ('trunk', 'oneword', 0.86, now() - interval '4 days 6 hours'),
  ('a', 'oneword', 0.91, now() - interval '4 days 12 hours'),
  ('GuardianOfTheDigital', 'oneword', 1.07, now() - interval '4 days 18 hours'),
  ('jose', 'oneword', 1.11, now() - interval '5 days'),
  ('asdf', 'oneword', 1.14, now() - interval '5 days 6 hours'),
  
  -- Typeracer entries
  ('aa', 'typeracer', 2.45, now() - interval '5 hours'),
  ('tem', 'typeracer', 3.87, now() - interval '14 hours'),
  ('hi', 'typeracer', 1.92, now() - interval '1 day 2 hours'),
  ('smolFry', 'typeracer', 4.56, now() - interval '1 day 10 hours'),
  ('ko', 'typeracer', 0.88, now() - interval '2 days 2 hours'),
  ('TomZacharski', 'typeracer', 2.34, now() - interval '2 days 6 hours'),
  ('z', 'typeracer', 5.67, now() - interval '2 days 20 hours'),
  ('cosmo', 'typeracer', 1.56, now() - interval '3 days 2 hours'),
  ('trunk', 'typeracer', 3.21, now() - interval '3 days 8 hours'),
  ('jose', 'typeracer', 6.78, now() - interval '4 days 2 hours'),
  
  -- More puzzle entries
  ('ebleb', 'puzzle', 0.89, now() - interval '8 hours'),
  ('ko', 'puzzle', 0.12, now() - interval '1 day 6 hours'),
  ('aa', 'puzzle', 0.42, now() - interval '1 day 14 hours'),
  ('z', 'puzzle', 2.15, now() - interval '2 days 10 hours'),
  ('ttt', 'puzzle', 1.67, now() - interval '2 days 22 hours'),
  ('Hhh', 'puzzle', 2.34, now() - interval '3 days 4 hours'),
  ('smolFry', 'puzzle', 1.43, now() - interval '3 days 14 hours'),
  ('hi', 'puzzle', 1.56, now() - interval '4 days 8 hours'),
  ('TomZacharski', 'puzzle', 0.67, now() - interval '4 days 20 hours'),
  ('tem', 'puzzle', 0.98, now() - interval '5 days 12 hours'),
  
  -- More oneword entries
  ('GuardianOfTheDigital', 'oneword', 1.23, now() - interval '9 hours'),
  ('anon', 'oneword', 0.64, now() - interval '1 day 4 hours'),
  ('x0', 'oneword', 0.88, now() - interval '1 day 16 hours'),
  ('jlo', 'oneword', 0.95, now() - interval '2 days 12 hours'),
  ('yo', 'oneword', 1.02, now() - interval '3 days 1 hour'),
  ('a', 'oneword', 1.18, now() - interval '3 days 16 hours'),
  ('asdf', 'oneword', 1.34, now() - interval '4 days 4 hours'),
  ('cosmo', 'oneword', 0.45, now() - interval '4 days 14 hours'),
  ('trunk', 'oneword', 0.92, now() - interval '5 days 8 hours'),
  ('jose', 'oneword', 1.28, now() - interval '5 days 18 hours'),
  
  -- Final mixed entries
  ('aa', 'typeracer', 3.12, now() - interval '10 hours'),
  ('ebleb', 'typeracer', 2.98, now() - interval '1 day 5 hours'),
  ('tem', 'puzzle', 0.87, now() - interval '1 day 18 hours'),
  ('hi', 'oneword', 1.45, now() - interval '2 days 14 hours'),
  ('smolFry', 'oneword', 1.33, now() - interval '3 days 3 hours'),
  ('ko', 'oneword', 0.52, now() - interval '3 days 20 hours'),
  ('z', 'oneword', 1.76, now() - interval '4 days 10 hours'),
  ('Hhh', 'typeracer', 4.23, now() - interval '5 days 2 hours'),
  ('ttt', 'typeracer', 5.89, now() - interval '5 days 14 hours'),
  ('TomZacharski', 'oneword', 0.78, now() - interval '6 days');

