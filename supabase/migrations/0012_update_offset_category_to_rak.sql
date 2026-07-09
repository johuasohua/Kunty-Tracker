-- Update the offset category name and treat_as value

update categories set name = 'Rak', treat_as = 'rak' where name = 'Offset';

-- Update the check constraint to only allow 'rak' (plus expense and income)
alter table categories drop constraint categories_treat_as_check;
alter table categories add constraint categories_treat_as_check
  check (treat_as in ('expense', 'income', 'rak'));
