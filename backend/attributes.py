"""
These are just data classes, essentially, but they're the only 'outlet'
between the rest of the backend and their core.py base classes.

(that is, nowhere else will you see the term 'PackedByteField'; just 'Perms')
"""
from .core import PackedByteField, PackedBigInt


class Perms(PackedByteField):
    _names = [
      'manage_location',
      'manage_accounts',
      'manage_roles',
      'create_admin_roles',
      'manage_media',
      'generate_reports',
      'return_items',
      ]


class Limits(PackedBigInt):
    _names = [
      'checkout_duration',
      'renewals',
      'holds',
      False,
      False,
      False,
      False,
      None
      ]


class Locks(PackedBigInt):
    _names = [
      'checkouts',  # checkout threshold
      'fines',  # fine threshold
      False,
      False,
      False,
      False,
      False,
      None
      ]
