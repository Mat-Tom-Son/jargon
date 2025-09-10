package translation

default allow = false

# Field and operator allowlists.  These values are examples and should be
# expanded or loaded from data sources in a real deployment.
allowed_fields := {
  "Opportunity": {"Id", "Name", "StageName", "Amount", "Owner.Name", "CreatedDate"},
  "Account":     {"Id", "Name", "BillingCountry", "Active__c", "Owner.Name"}
}

allowed_ops := {"=", "IN", "LIKE", ">", "<", ">=", "<="}

# Deny if personally identifiable information (PII) has been requested.
deny[msg] {
  input.pii_requested == true
  msg := "pii_block"
}

# Deny if any requested field is not explicitly allow‑listed for the object.
deny[msg] {
  some f
  f := input.fields[_]
  not f in allowed_fields[input.object]
  msg := sprintf("field_denied:%s", [f])
}

# Deny if any operator used in the query is not allowed.
deny[msg] {
  some op
  op := input.operators[_]
  not op in allowed_ops
  msg := sprintf("op_denied:%s", [op])
}

# Allow if no deny rules fire.
allow {
  not deny[_]
}